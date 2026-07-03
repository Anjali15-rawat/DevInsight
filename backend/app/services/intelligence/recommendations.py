"""
Recommendation Engine — generates prioritized, actionable engineering recommendations.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository
from app.services.intelligence.repository import compute_repository_intelligence
from app.services.intelligence.tech_debt import compute_technical_debt
from app.services.intelligence.bug import compute_bug_intelligence

async def generate_recommendations(db: AsyncSession, workspace_id: int) -> list[dict]:
    """
    Analyzes workspace health across all repositories and outputs a prioritized list of recommendations.
    """
    repo_stmt = select(Repository).where(Repository.workspace_id == workspace_id)
    repos = (await db.execute(repo_stmt)).scalars().all()

    recommendations = []

    for repo in repos:
        # Fetch intelligence metrics for this repo
        try:
            repo_intel = await compute_repository_intelligence(db, repo.id)
            debt_intel = await compute_technical_debt(db, repo.id)
            bug_intel = await compute_bug_intelligence(db, workspace_id, repo.id)
        except Exception:
            # Fallback to defaults if computation fails (e.g. empty repository data)
            continue

        # ─── Rule 1: Security vulnerabilities ──────────────────────────────────
        sec_score = repo_intel.get("security_score", 100.0)
        alerts_count = repo_intel.get("metrics", {}).get("security_alerts_count", repo.security_alerts_count)
        if sec_score < 80.0 or alerts_count > 0:
            recommendations.append({
                "title": "Address Pending Security Vulnerabilities",
                "priority": "high" if sec_score < 60.0 else "medium",
                "reason": "Security vulnerabilities expose the codebase to potential threats.",
                "evidence": f"Repository has a Security Score of {sec_score} with {alerts_count} open alerts.",
                "affected_repository": repo.name,
                "expected_impact": "Secures the codebase, fixes potential exploits, and raises the Security Grade.",
                "confidence": "high",
                "category": "Security"
            })

        # ─── Rule 2: Code Coverage ────────────────────────────────────────────
        coverage = repo.code_coverage
        if coverage is not None and coverage < 80.0:
            recommendations.append({
                "title": "Improve Test Coverage",
                "priority": "high" if coverage < 50.0 else "medium",
                "reason": "Low test coverage increases the risk of introducing regression bugs during refactoring.",
                "evidence": f"Current code coverage is at {round(coverage, 1)}%, which is below the 80% threshold.",
                "affected_repository": repo.name,
                "expected_impact": "Reduces regression risk, improves software quality, and boosts the Code Quality Score.",
                "confidence": "high",
                "category": "Quality"
            })

        # ─── Rule 3: High Technical Debt (Code Smells) ────────────────────────
        debt_score = debt_intel.get("technical_debt_score", 100.0)
        smells_count = debt_intel.get("metrics", {}).get("code_smells_count", 0)
        high_risk_areas = debt_intel.get("high_risk_areas", [])
        if debt_score < 75.0 or smells_count > 10:
            target_file = high_risk_areas[0]["file_path"] if high_risk_areas else "core modules"
            recommendations.append({
                "title": f"Refactor Code Smells in {target_file}",
                "priority": "high" if debt_score < 50.0 else "medium",
                "reason": "Code smells and technical debt accumulate over time, slowing down developer velocity.",
                "evidence": f"Technical Debt Score is {debt_score} with {smells_count} pending code smells.",
                "affected_repository": repo.name,
                "expected_impact": "Simplifies implementation logic, reduces cognitive complexity, and improves maintainability.",
                "confidence": "medium",
                "category": "Maintainability"
            })

        # ─── Rule 4: Bug Hotspots ─────────────────────────────────────────────
        bug_health = bug_intel.get("bug_health_score", 100.0)
        open_bugs = bug_intel.get("metrics", {}).get("open_bugs_count", 0)
        if bug_health < 80.0 or open_bugs > 5:
            recommendations.append({
                "title": "Resolve High-Priority Bugs & Issues",
                "priority": "high" if bug_health < 60.0 else "medium",
                "reason": "Unresolved bugs degrade user experience and signal stability risks.",
                "evidence": f"Bug Health Score is {bug_health} with {open_bugs} open bugs.",
                "affected_repository": repo.name,
                "expected_impact": "Enhances software stability and boosts product confidence.",
                "confidence": "high",
                "category": "Stability"
            })

        # ─── Rule 5: Large Pull Request Sizes ─────────────────────────────────
        avg_additions = repo_intel.get("metrics", {}).get("lines_analyzed", 0) / max(1, repo_intel.get("metrics", {}).get("open_prs_count", 1))
        large_prs_count = debt_intel.get("metrics", {}).get("large_prs_count", 0)
        if large_prs_count > 2:
            recommendations.append({
                "title": "Reduce Average Pull Request Sizes",
                "priority": "low",
                "reason": "Large pull requests are difficult to review, leading to delayed merges and missed bugs.",
                "evidence": f"Found {large_prs_count} pull requests exceeding 500 lines of changes.",
                "affected_repository": repo.name,
                "expected_impact": "Accelerates review cycles, increases review precision, and lowers risk of code regressions.",
                "confidence": "medium",
                "category": "Process"
            })

        # ─── Rule 6: Open TODO comments ───────────────────────────────────────
        todos_count = debt_intel.get("metrics", {}).get("todos_count", 0)
        if todos_count > 15:
            recommendations.append({
                "title": "Address Pending TODO Comments",
                "priority": "low",
                "reason": "TODO comments often accumulate indefinitely, leaving planned fixes unaddressed.",
                "evidence": f"There are currently {todos_count} unresolved TODO / FIXME comments in the codebase.",
                "affected_repository": repo.name,
                "expected_impact": "Clean-up of planned technical debt and completion of deferred features.",
                "confidence": "high",
                "category": "Maintainability"
            })

    # Sort recommendations by priority: high -> medium -> low
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda r: priority_order.get(r["priority"], 3))

    return recommendations
