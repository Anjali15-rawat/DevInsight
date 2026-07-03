"""
Security Agent.

Analyzes PR diffs and dependency files for:
  - OWASP Top 10 vulnerabilities
  - SQL injection risks
  - Secret/API key exposure
  - Vulnerable dependency versions (CVE references)
  - Prototype pollution patterns
  - Insecure cryptographic practices
  - SSRF, XSS, path traversal patterns
  - Timing attack vulnerabilities
"""
from typing import Any

from app.agents.base_agent import BaseAgent, register_agent
from app.schemas.agent_contracts import AgentInput, AgentFinding

SYSTEM_PROMPT = """
You are DevInsight's Security Agent — a senior application security engineer with expertise in OWASP Top 10, CVE analysis, and secure coding practices across multiple programming languages.

Your job is to analyze a pull request diff for security vulnerabilities.

For each security issue found, output a JSON object with a "findings" array and a "summary" string.

Each finding MUST follow this exact schema:
{
  "file_path": "path/to/file.ext",
  "line_number": 42,
  "severity": "critical" | "warning" | "optimization",
  "confidence": "high" | "medium" | "low",
  "explanation": "Clear explanation of the vulnerability, attack vector, and risk",
  "suggested_fix": "Corrected secure code snippet",
  "estimated_impact": "What an attacker could do by exploiting this",
  "related_doc": "OWASP/CVE reference name",
  "doc_url": "https://owasp.org/... or https://nvd.nist.gov/..."
}

Security categories to check:
- A01: Broken Access Control
- A02: Cryptographic Failures (weak crypto, missing encryption, timing attacks)
- A03: Injection (SQL, NoSQL, Command, LDAP)
- A04: Insecure Design patterns
- A05: Security Misconfiguration (hardcoded secrets, debug flags in prod)
- A06: Vulnerable and Outdated Dependencies (flag specific CVEs if detectable)
- A07: Auth/Session failures
- A08: Software and Data Integrity failures
- A09: Logging/Monitoring failures (sensitive data in logs)
- A10: SSRF patterns

Rules:
- severity "critical": Direct exploitable vulnerability (SQLi, secret in code, SSRF, timing attack on crypto)
- severity "warning": Potential security weakness requiring attention
- severity "optimization": Security improvement recommendation

Respond with a JSON object: {"summary": "...", "confidence": "high|medium|low", "findings": [...]}
Return {"summary": "No security issues found.", "confidence": "high", "findings": []} if no issues found.
Do NOT fabricate vulnerabilities. Only report what is visible in the diff.
"""


@register_agent("security")
class SecurityAgent(BaseAgent):
    agent_type = "security"

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def build_prompt(self, input_data: AgentInput) -> str:
        diff = self.truncate_diff(input_data.target_content, max_chars=80_000)
        pr_title = input_data.metadata.get("pr_title", "Untitled PR")
        repo = input_data.metadata.get("repo", "unknown")
        package_files = input_data.metadata.get("package_files", "")

        prompt = f"""## Pull Request: {pr_title}
## Repository: {repo}

## Code Diff:
```diff
{diff}
```"""

        if package_files:
            prompt += f"""

## Dependency Files (package.json / requirements.txt / go.mod etc.):
```
{package_files[:5000]}
```"""

        prompt += "\n\nAnalyze this pull request for security vulnerabilities. Return a JSON object with \"summary\", \"confidence\", and \"findings\" array."
        return prompt

    def parse_findings(self, raw_json: dict[str, Any]) -> list[AgentFinding]:
        findings_list = raw_json.get("findings", [])
        if not isinstance(findings_list, list):
            return []
        results = []
        for f in findings_list:
            results.append(AgentFinding(
                title=f.get("explanation", "Security finding")[:120],
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
