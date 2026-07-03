import asyncio
import structlog
from typing import Any

from app.core.exceptions import AgentError
from app.agents.base_agent import agent_registry
from app.schemas.agent_contracts import AgentInput, AgentOutput

# Ensure all agents are imported so they register themselves via decorators
import app.agents.code_quality_agent
import app.agents.security_agent
import app.agents.performance_agent
import app.agents.bug_triage_agent
import app.agents.root_cause_agent
import app.agents.knowledge_agent

logger = structlog.get_logger(__name__)


class AgentOrchestrator:
    """
    Central coordinator for all AI agent runs using the AgentRegistry.
    Handles parallel execution, partial failures, and timeouts.
    """

    async def analyze_pull_request(
        self,
        task_id: str,
        target_content: str,
        metadata: dict[str, Any],
        rag_context: str | None = None,
    ) -> dict[str, Any]:
        """
        Run Code Quality, Security, and Performance agents concurrently.
        Gracefully handles partial failures.
        """
        logger.info("orchestrator_pr_analysis_start", repo=metadata.get("repo"), task_id=task_id)

        agent_input = AgentInput(
            task_id=task_id,
            target_type="pull_request",
            target_content=target_content,
            metadata=metadata,
            rag_context=rag_context,
        )

        # Retrieve agents from registry
        cq_agent = agent_registry.get_agent("code_quality")
        sec_agent = agent_registry.get_agent("security")
        perf_agent = agent_registry.get_agent("performance")

        results = await asyncio.gather(
            cq_agent.run(agent_input),
            sec_agent.run(agent_input),
            perf_agent.run(agent_input),
            return_exceptions=True,
        )

        all_findings = []
        total_tokens = 0
        total_duration = 0
        agent_types = ["code_quality", "security", "performance"]

        for agent_type, result in zip(agent_types, results):
            if isinstance(result, Exception):
                logger.error("orchestrator_agent_failed", agent_type=agent_type, error=str(result))
                # Push a fallback finding to indicate partial failure
                all_findings.append({
                    "title": f"[{agent_type.upper()}] Analysis Failed",
                    "description": f"The {agent_type} agent encountered an error: {str(result)}",
                    "severity": "info",
                    "agent_type": agent_type
                })
                continue

            # result is an AgentOutput instance
            for finding in result.findings:
                finding_dict = finding.model_dump()
                finding_dict["agent_type"] = agent_type
                all_findings.append(finding_dict)

            total_tokens += result.token_usage.get("total_tokens", 0)
            total_duration = max(total_duration, result.execution_duration_ms)

        logger.info(
            "orchestrator_pr_analysis_complete",
            task_id=task_id,
            total_findings=len(all_findings),
            total_tokens=total_tokens,
        )

        return {
            "status": "partial_failure" if any(isinstance(r, Exception) for r in results) else "success",
            "findings": all_findings,
            "total_tokens": total_tokens,
            "total_duration_ms": total_duration,
        }

    async def run_single_agent(self, agent_type: str, input_data: AgentInput) -> AgentOutput:
        """Manually trigger a single named agent."""
        agent = agent_registry.get_agent(agent_type)
        return await agent.run(input_data)

    async def analyze_pull_request_with_rag(
        self,
        task_id: str,
        target_content: str,
        metadata: dict[str, Any],
        db: Any,
        workspace_id: int,
    ) -> dict[str, Any]:
        """
        RAG-enhanced PR analysis: retrieves relevant knowledge first,
        then passes it as context to all PR agents.
        """
        from app.rag.retriever import retrieve_relevant_chunks, format_chunks_for_prompt

        # Retrieve relevant knowledge from the workspace
        chunks = await retrieve_relevant_chunks(
            db, target_content[:500], workspace_id, top_k=5
        )
        rag_context = format_chunks_for_prompt(chunks) if chunks else None

        return await self.analyze_pull_request(
            task_id=task_id,
            target_content=target_content,
            metadata=metadata,
            rag_context=rag_context,
        )

    async def search_knowledge(
        self,
        query: str,
        retrieved_chunks: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Run the Knowledge agent with pre-retrieved chunks to synthesize an answer.
        Convenience method for backward compatibility.
        """
        rag_text = "\n\n".join(c.get("content", "") for c in retrieved_chunks)
        agent_input = AgentInput(
            task_id="knowledge-search",
            target_type="query",
            target_content=query,
            metadata={},
            rag_context=rag_text,
        )
        result = await self.run_single_agent("knowledge", agent_input)
        return {"answer": result.summary, "status": result.status}


# Singleton instance
orchestrator = AgentOrchestrator()
