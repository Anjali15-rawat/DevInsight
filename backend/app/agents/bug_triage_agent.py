"""
Bug Triage Agent.

Classifies GitHub issues into:
  - Priority: P0 (critical/production down) → P3 (minor/cosmetic)
  - Category: Database, Security, Performance, Auth, Hydration, Network, UI, Other
  - Suggested assignee (by engineering area)
  - Severity confidence score
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Bug Triage Agent — an experienced engineering lead who classifies and prioritizes incoming bug reports.

Given a GitHub issue title and body, classify the bug and return a JSON object.

Output schema:
{
  "summary": "Brief summary of the triage decision",
  "confidence": "high" | "medium" | "low",
  "findings": [
    {
      "title": "Bug Classification: <priority> — <category>",
      "description": "Brief explanation of why this priority and category were assigned",
      "severity": "critical" | "high" | "medium" | "low",
      "suggested_labels": ["bug", "priority:p0", "area:database"],
      "estimated_resolution_time": "e.g. '2-4 hours', '1-2 days'"
    }
  ]
}

Priority definitions:
- P0: Production is down or data loss is occurring. Requires immediate action. → severity "critical"
- P1: Major feature is broken, significant user impact. Fix within 24 hours. → severity "high"
- P2: Feature partially broken, workaround exists. Fix within 1 week. → severity "medium"
- P3: Minor issue, cosmetic, or low impact. Fix in next sprint. → severity "low"

Always output valid JSON. Use your engineering expertise to classify accurately.
"""


@register_agent("bug_triage")
class BugTriageAgent(BaseAgent):
    agent_type = "bug_triage"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        return f"""## GitHub Issue

**Title:** {input_data.metadata.get("title", "Untitled Issue")}

**Repository:** {input_data.metadata.get("repo", "unknown")}

**Issue Body:**
{input_data.target_content or input_data.metadata.get("body", "No description provided.")}

Classify this bug issue. Return a JSON object with "summary", "confidence", and "findings" array."""

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            # Fallback: wrap the entire response as a single finding
            return [AgentFinding(
                title=f"Bug Classification: {raw_json.get('priority', 'P2')} — {raw_json.get('category', 'Other')}",
                description=raw_json.get("reasoning", raw_json.get("summary", "Could not parse AI response — defaulted to P2")),
                severity=_priority_to_severity(raw_json.get("priority", "P2")),
                recommendation=raw_json.get("estimated_resolution_time"),
            )]
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("title", "Bug Classification"),
                description=f.get("description", ""),
                severity=f.get("severity", "medium"),
                recommendation=f.get("estimated_resolution_time"),
            ))
        return results


def _priority_to_severity(priority: str) -> str:
    """Map P0-P3 to AgentFinding severity levels."""
    mapping = {"P0": "critical", "P1": "high", "P2": "medium", "P3": "low"}
    return mapping.get(priority, "medium")
