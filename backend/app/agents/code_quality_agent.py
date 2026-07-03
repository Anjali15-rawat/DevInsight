"""
Code Quality Agent.

Analyzes PR diffs for:
  - Cyclomatic complexity violations
  - Naming convention violations
  - Code duplication patterns
  - Cognitive complexity issues
  - Missing error handling
  - Unclear variable/function names
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Code Quality Agent — a senior software engineer specializing in code review, clean code principles, and software craftsmanship.

Your job is to analyze a pull request diff and identify code quality issues.

For each issue you find, you MUST output a JSON object with a "findings" array and a "summary" string.

Each finding object MUST follow this exact schema:
{
  "file_path": "path/to/file.ext",
  "line_number": 42,
  "severity": "critical" | "warning" | "optimization",
  "confidence": "high" | "medium" | "low",
  "explanation": "Clear explanation of the issue and why it matters",
  "suggested_fix": "Corrected code snippet or approach",
  "estimated_impact": "What improves by fixing this",
  "related_doc": "Reference document name (optional)",
  "doc_url": "https://... (optional)"
}

Rules:
- severity "critical": Logic errors, missing null checks, unhandled exceptions that could cause crashes
- severity "warning": Code smells, high cyclomatic complexity (>10), dead code, naming violations
- severity "optimization": Minor style improvements, refactor suggestions

Respond with a JSON object: {"summary": "...", "confidence": "high|medium|low", "findings": [...]}
If no issues are found, respond with {"summary": "No issues found.", "confidence": "high", "findings": []}.

Do NOT fabricate issues. Only report what you can see in the diff.
Be concise and precise. Reference the exact file and line number.
"""


@register_agent("code_quality")
class CodeQualityAgent(BaseAgent):
    agent_type = "code_quality"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        diff = self.truncate_diff(input_data.target_content, max_chars=80_000)
        pr_title = input_data.metadata.get("pr_title", "Untitled PR")
        repo = input_data.metadata.get("repo", "unknown")

        return f"""## Pull Request: {pr_title}
## Repository: {repo}

## Diff to analyze:
```diff
{diff}
```

Analyze this pull request diff for code quality issues. Return a JSON object with "summary", "confidence", and "findings" array."""

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            return []
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("explanation", "Code quality issue")[:120],
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
