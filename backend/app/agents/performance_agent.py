"""
Performance Agent.

Analyzes PR diffs for:
  - N+1 database query patterns
  - Missing context timeouts on DB/HTTP calls
  - Race conditions in concurrent code
  - Blocking operations in async contexts
  - Missing database indexes (inferred from query patterns)
  - Memory leaks (unclosed resources)
  - Redundant re-computation inside loops
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Performance Agent — a backend performance engineer specializing in database optimization, concurrency, and latency reduction.

Analyze pull request diffs for performance issues.

Output a JSON object with a "findings" array and a "summary" string. Each finding MUST follow this schema:
{
  "file_path": "path/to/file.ext",
  "line_number": 42,
  "severity": "critical" | "warning" | "optimization",
  "confidence": "high" | "medium" | "low",
  "explanation": "Clear explanation of the performance issue and why it hurts",
  "suggested_fix": "Corrected code that solves the performance issue",
  "estimated_impact": "Quantified improvement e.g. '3x faster', 'prevents connection exhaustion'",
  "related_doc": "Reference doc name",
  "doc_url": "https://..."
}

Performance categories to check:
- N+1 queries: Queries inside loops that should be batched
- Missing timeouts: DB/HTTP calls without context deadlines
- Blocking I/O: Synchronous calls inside async event loops
- Race conditions: Shared state accessed without locks in concurrent code
- Deadlocks: Nested locks or lock acquisition order issues
- Memory leaks: File/connection handles not properly closed
- Redundant computation: Expensive calculations inside tight loops
- Missing caching: Repeated identical queries that could be memoized

Respond with a JSON object: {"summary": "...", "confidence": "high|medium|low", "findings": [...]}
Return {"summary": "No performance issues found.", "confidence": "high", "findings": []} if no issues found.
Do NOT fabricate findings. Only report what is visible in the diff.
"""


@register_agent("performance")
class PerformanceAgent(BaseAgent):
    agent_type = "performance"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        diff = self.truncate_diff(input_data.target_content, max_chars=80_000)
        return f"""## Pull Request: {input_data.metadata.get("pr_title", "Untitled")}
## Repository: {input_data.metadata.get("repo", "unknown")}

## Diff:
```diff
{diff}
```

Analyze for performance issues. Return a JSON object with "summary", "confidence", and "findings" array."""

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            return []
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("explanation", "Performance issue")[:120],
                description=f.get("explanation", ""),
                severity=_map_severity(f.get("severity", "warning")),
                recommendation=f.get("suggested_fix"),
                file_path=f.get("file_path"),
                line_number=f.get("line_number"),
            ))
        return results


def _map_severity(severity: str) -> str:
    """Map agent-specific severity to AgentFinding severity levels."""
    mapping = {
        "critical": "critical",
        "warning": "medium",
        "optimization": "low",
    }
    return mapping.get(severity.lower(), "medium")
