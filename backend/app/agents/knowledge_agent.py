"""
Knowledge Agent.

Answers engineering questions by:
  1. Receiving retrieved knowledge base chunks from the RAG engine
  2. Synthesizing those chunks into a coherent, accurate answer
  3. Citing the source documents used

Used in the AI Workspace "Knowledge" tab and when other agents
need company-specific context injected into their prompts.
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Knowledge Agent — an engineering librarian who synthesizes company-specific technical documentation into clear, accurate answers.

You will receive:
1. A user's question or topic
2. A set of retrieved documentation chunks from the company knowledge base

Your job is to synthesize these chunks into a comprehensive, grounded answer.

Output schema:
{
  "summary": "Brief summary of the synthesis",
  "confidence": "high" | "medium" | "low",
  "findings": [
    {
      "title": "Synthesized Answer",
      "description": "Your synthesized answer here — detailed, accurate, and citing sources",
      "severity": "info",
      "sources": ["document_name_1", "document_name_2"],
      "caveat": "Any important limitation or uncertainty about this answer, or null"
    }
  ]
}

Rules:
- ONLY use information from the provided documentation chunks. Do NOT use general knowledge.
- If the chunks do not contain enough information, say so with low confidence.
- Be precise and technical. Engineers are reading this.
- Quote relevant sections when helpful.

Always output valid JSON with a "findings" array containing a single finding with the answer.
"""


@register_agent("knowledge")
class KnowledgeAgent(BaseAgent):
    agent_type = "knowledge"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        query = input_data.target_content
        # Retrieved chunks could be pre-formatted or passed as raw metadata list or within rag_context
        chunks_text = input_data.rag_context or "No relevant documentation found in the knowledge base."

        return f"""## User Query:
{query}

## Retrieved Documentation:
{chunks_text}

Synthesize an answer based solely on the provided documentation. Return a JSON object with "summary", "confidence", and "findings" array."""

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            # Fallback: check if the model used the old schema and wrap it
            return [AgentFinding(
                title="Synthesized Answer",
                description=raw_json.get("answer", raw_json.get("summary", "No answer could be parsed.")),
                severity="info",
                recommendation=raw_json.get("caveat"),
            )]
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("title", "Synthesized Answer"),
                description=f.get("description", ""),
                severity=f.get("severity", "info"),
                recommendation=f.get("caveat"),
            ))
        return results
