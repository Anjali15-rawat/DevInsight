import asyncio
import json
import time
from abc import ABC, abstractmethod
from typing import Any

import structlog
from pydantic import ValidationError

from app.core.config import settings
from app.core.exceptions import AgentError, AgentTimeoutError
from app.schemas.agent_contracts import AgentInput, AgentOutput, AgentFinding
from app.agents.providers import BaseProvider, GeminiProvider

logger = structlog.get_logger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all DevInsight AI agents.

    Subclasses must implement:
      - agent_type: str identifier
      - system_prompt: str — the agent's persona and instructions
      - build_prompt(input_data: AgentInput): constructs the user-turn prompt
      - parse_findings(raw_json: dict) -> list[AgentFinding]: parses to standard findings
    """

    agent_type: str = "base"

    def __init__(self, provider: BaseProvider | None = None):
        self._provider = provider or GeminiProvider()

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """The system prompt that defines this agent's persona and output schema."""
        ...

    @abstractmethod
    def build_prompt(self, input_data: AgentInput) -> str:
        """Build the user-turn prompt from the standardized input contract."""
        ...

    @abstractmethod
    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        """Convert the raw JSON dictionary from the LLM into a list of AgentFindings."""
        ...

    async def run(self, input_data: AgentInput) -> AgentOutput:
        """
        Execute the agent: build prompt → call Provider → parse response → return contract.
        """
        start = time.perf_counter()

        # Build prompt
        prompt = self.build_prompt(input_data)
        if input_data.rag_context:
            prompt = f"## Relevant internal documentation:\n{input_data.rag_context}\n\n---\n\n{prompt}"

        logger.info("agent_starting", agent_type=self.agent_type, task_id=input_data.task_id)

        try:
            # Generate using provider
            response = await asyncio.wait_for(
                self._provider.generate_structured(prompt, self.system_prompt),
                timeout=settings.AGENT_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error("agent_timeout", agent_type=self.agent_type, task_id=input_data.task_id)
            raise AgentTimeoutError(self.agent_type)
        except Exception as e:
            logger.error("agent_execution_error", agent_type=self.agent_type, error=str(e))
            raise AgentError(self.agent_type, str(e)) from e

        duration_ms = round((time.perf_counter() - start) * 1000)
        raw_text = response.get("text", "")
        token_usage = response.get("token_usage", {})
        provider_used = response.get("provider_used", "unknown")

        try:
            parsed_json = self.parse_json_safely(raw_text)
            findings = self.parse_findings(parsed_json)
        except Exception as e:
            # Complete failure to parse
            return AgentOutput(
                status="failure",
                confidence_score=0.0,
                summary=f"Failed to parse agent response: {str(e)}",
                findings=[],
                execution_duration_ms=duration_ms,
                token_usage=token_usage,
                provider_used=provider_used,
            )

        # Basic confidence calculation (can be overridden by subclasses)
        confidence = parsed_json.get("confidence", "low")
        confidence_map = {"high": 0.9, "medium": 0.6, "low": 0.3}
        confidence_score = confidence_map.get(str(confidence).lower(), 0.5)

        logger.info(
            "agent_completed",
            agent_type=self.agent_type,
            task_id=input_data.task_id,
            duration_ms=duration_ms,
            findings_count=len(findings),
        )

        # Telemetry for AI Evaluation Framework (Task 4.9)
        logger.info(
            "ai_evaluation_trace",
            agent_type=self.agent_type,
            task_id=input_data.task_id,
            status="success",
            confidence_score=confidence_score,
            total_tokens=token_usage.get("total_tokens", 0),
            duration_ms=duration_ms,
            provider=provider_used,
            findings_count=len(findings),
        )

        return AgentOutput(
            status="success",
            confidence_score=confidence_score,
            summary=parsed_json.get("summary", "Analysis completed."),
            findings=findings,
            execution_duration_ms=duration_ms,
            token_usage=token_usage,
            provider_used=provider_used,
        )

    @staticmethod
    def parse_json_safely(text: str) -> dict[str, Any]:
        """Parse JSON from AI response, handling markdown code fence wrapping."""
        text = text.strip()
        
        # Safely remove opening fence
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
            
        # Safely remove closing fence
        if text.endswith("```"):
            text = text[:-3]
            
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("json_parse_error", raw_text=text, error=str(e))
            raise AgentError("base", f"Failed to parse AI JSON response: {str(e)}") from e

    @staticmethod
    def truncate_diff(diff: str, max_chars: int = 80_000) -> str:
        if len(diff) <= max_chars:
            return diff
        return diff[:max_chars] + f"\n\n... [DIFF TRUNCATED: showing first {max_chars} chars of {len(diff)} total]"


class AgentRegistry:
    """
    Singleton registry to manage available AI Agents.
    """
    def __init__(self):
        self._agents: dict[str, type[BaseAgent]] = {}

    def register(self, agent_type: str, agent_class: type[BaseAgent]):
        self._agents[agent_type] = agent_class
        logger.debug("agent_registered", agent_type=agent_type)

    def get_agent(self, agent_type: str, provider: BaseProvider | None = None) -> BaseAgent:
        if agent_type not in self._agents:
            raise ValueError(f"Agent '{agent_type}' is not registered.")
        return self._agents[agent_type](provider=provider)


# Global registry instance
agent_registry = AgentRegistry()


def register_agent(agent_type: str):
    """Decorator to auto-register an agent class."""
    def wrapper(cls: type[BaseAgent]):
        agent_registry.register(agent_type, cls)
        return cls
    return wrapper
