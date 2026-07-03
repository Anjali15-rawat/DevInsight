"""
Root Cause Agent.

Analyzes error logs, stack traces, and issue descriptions to:
  - Identify the likely root cause
  - Pinpoint the affected file and function
  - Suggest a concrete fix
  - Estimate confidence in the diagnosis
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Root Cause Agent — a principal engineer who specializes in incident post-mortems, stack trace analysis, and finding the exact source of production failures.

Given an error description, stack trace, and/or issue body, perform root cause analysis and return a JSON object.

Output schema:
{
  "summary": "Brief summary of the root cause analysis",
  "confidence": "high" | "medium" | "low",
  "findings": [
    {
      "title": "Root cause description",
      "description": "Precise explanation of what is causing the failure",
      "severity": "critical" | "high" | "medium" | "low",
      "file_path": "path/to/failing_file.ext or null",
      "function_name": "functionName or null",
      "suggested_fix": "Specific code change or remediation step",
      "contributing_factors": ["factor 1", "factor 2"],
      "prevention": "How to prevent this class of issue in future"
    }
  ]
}

Rules:
- Be specific — name exact files, functions, and line patterns when visible
- Distinguish between symptoms and root causes
- If stack trace is available, trace from the outermost frame inward
- If the cause is unclear, say so with low confidence rather than guessing

Always output valid JSON.
"""


@register_agent("root_cause")
class RootCauseAgent(BaseAgent):
    agent_type = "root_cause"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        return f"""## Incident: {input_data.metadata.get("title", "Unknown Error")}

**Repository:** {input_data.metadata.get("repo", "unknown")}

**Error Description / Issue Body:**
{input_data.target_content or input_data.metadata.get("body", "No description provided.")}

**Stack Trace (if available):**
```
{input_data.metadata.get("stack_trace", "No stack trace provided.")}
```

Perform root cause analysis. Return a JSON object with "summary", "confidence", and "findings" array."""

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            # Fallback: wrap the entire response as a single finding
            return [AgentFinding(
                title=raw_json.get("likely_cause", "Root cause analysis")[:120],
                description=raw_json.get("likely_cause", "Could not parse AI analysis"),
                severity="high",
                recommendation=raw_json.get("suggested_fix", "Manual investigation required"),
                file_path=raw_json.get("affected_file"),
            )]
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("title", "Root cause finding")[:120],
                description=f.get("description", ""),
                severity=f.get("severity", "high"),
                recommendation=f.get("suggested_fix"),
                file_path=f.get("file_path"),
            ))
        return results
