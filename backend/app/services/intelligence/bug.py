"""
Bug Intelligence Engine — analyzes bug reports, resolution times, hotspots, duplicate rates, and calculates Bug Health scores.
"""
from datetime import UTC, datetime, timedelta
from collections import Counter
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bug import Bug, BugRootCause
from app.models.repository import Repository

async def compute_bug_intelligence(db: AsyncSession, workspace_id: int, repo_id: int | None = None) -> dict:
    """
    Computes bug metrics, root cause trends, hotspots, resolution speed, and bug health scores.
    """
    # ─── Resolve repositories for workspace ───────────────────────────────────
    repo_stmt = select(Repository.id).where(Repository.workspace_id == workspace_id)
    if repo_id:
        repo_stmt = repo_stmt.where(Repository.id == repo_id)
    repo_ids = [row[0] for row in (await db.execute(repo_stmt)).all()]

    if not repo_ids:
        return _get_empty_bug_report()

    # ─── Fetch Bug reports ────────────────────────────────────────────────────
    bug_stmt = (
        select(Bug)
        .options(selectinload(Bug.root_cause), selectinload(Bug.repository))
        .where(Bug.repository_id.in_(repo_ids))
    )
    bugs_result = await db.execute(bug_stmt)
    bugs = bugs_result.scalars().all()

    total_bugs = len(bugs)
    if total_bugs == 0:
        return _get_empty_bug_report()

    # ─── Severity / Priority count ────────────────────────────────────────────
    priority_counts = Counter(b.priority for b in bugs)  # "P0", "P1", "P2", "P3"
    category_counts = Counter(b.category for b in bugs)  # "Database", "UI", etc.
    status_counts = Counter(b.status for b in bugs)      # "Triage", "Backlog", "In Progress", "Resolved"

    open_bugs = [b for b in bugs if b.status != "Resolved"]
    resolved_bugs = [b for b in bugs if b.status == "Resolved"]

    # ─── Resolution Time (average hours to resolve) ───────────────────────────
    durations_hours = []
    for bug in resolved_bugs:
        if bug.github_closed_at and bug.github_created_at:
            delta = bug.github_closed_at - bug.github_created_at
            durations_hours.append(delta.total_seconds() / 3600.0)
    avg_resolution_time_hours = sum(durations_hours) / len(durations_hours) if durations_hours else 0.0

    # ─── Bug Density (relative to analyzed lines) ─────────────────────────────
    lines_stmt = select(func.sum(Repository.analyzed_lines)).where(Repository.id.in_(repo_ids))
    total_lines = (await db.execute(lines_stmt)).scalar() or 0
    bug_density_per_kloc = (total_bugs / (total_lines / 1000.0)) if total_lines > 0 else 0.0

    # ─── Hotspot Files ────────────────────────────────────────────────────────
    # Files associated with the most bugs (from Root Cause Agent analysis)
    hotspot_files = []
    for bug in bugs:
        if bug.root_cause and bug.root_cause.affected_file:
            hotspot_files.append(bug.root_cause.affected_file)

    hotspot_counter = Counter(hotspot_files)
    most_common_hotspots = [
        {"file": file, "count": count}
        for file, count in hotspot_counter.most_common(5)
    ]

    # ─── Reopened Issues (Simulated based on triage updates or fixed rates) ────
    # For simulation: assume a small fraction of bugs have been reopened if resolved,
    # or base on category complexity.
    reopened_count = sum(1 for b in bugs if b.priority == "P0" and b.status == "Triage")
    reopened_rate = reopened_count / total_bugs if total_bugs > 0 else 0.0

    # ─── Duplicate Rate (Simulated/Calculated based on title overlaps) ────────
    duplicate_count = 0
    titles = [b.title.lower() for b in bugs]
    for i, title in enumerate(titles):
        for j, other in enumerate(titles):
            if i != j and title in other and len(title) > 8:
                duplicate_count += 1
                break
    duplicate_rate = duplicate_count / total_bugs if total_bugs > 0 else 0.0

    # ─── Bug Health Score ─────────────────────────────────────────────────────
    # High score means low/no bugs, or resolved quickly.
    # Base: 100. Penalize open critical bugs heavily.
    open_p0 = sum(1 for b in open_bugs if b.priority == "P0")
    open_p1 = sum(1 for b in open_bugs if b.priority == "P1")
    open_p2 = sum(1 for b in open_bugs if b.priority == "P2")

    bug_health_score = 100.0 - (30.0 * open_p0) - (15.0 * open_p1) - (5.0 * open_p2)
    # Deduct penalty for slow resolution time (> 120 hours)
    if avg_resolution_time_hours > 120.0:
        bug_health_score -= 10.0
    elif avg_resolution_time_hours > 48.0:
        bug_health_score -= 5.0

    bug_health_score = round(max(0.0, min(100.0, bug_health_score)), 1)

    # ─── Bug Trends ───────────────────────────────────────────────────────────
    # Group bugs by created_at date over the last 7 days
    now = datetime.now(UTC)
    trend_points = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        created_count = sum(1 for b in bugs if b.github_created_at and b.github_created_at.strftime("%Y-%m-%d") == day_str)
        resolved_count = sum(1 for b in bugs if b.github_closed_at and b.github_closed_at.strftime("%Y-%m-%d") == day_str)
        trend_points.append({
            "date": day_str,
            "created": created_count,
            "resolved": resolved_count
        })

    return {
        "workspace_id": workspace_id,
        "repository_id": repo_id,
        "bug_health_score": bug_health_score,
        "metrics": {
            "total_bugs_reported": total_bugs,
            "open_bugs_count": len(open_bugs),
            "resolved_bugs_count": len(resolved_bugs),
            "avg_resolution_time_hours": round(avg_resolution_time_hours, 1),
            "bug_density_per_kloc": round(bug_density_per_kloc, 3),
            "duplicate_rate": round(duplicate_rate, 2),
            "reopened_rate": round(reopened_rate, 2),
        },
        "distributions": {
            "priority": dict(priority_counts),
            "category": dict(category_counts),
            "status": dict(status_counts),
        },
        "hotspots": most_common_hotspots,
        "trend_report": trend_points,
    }


def _get_empty_bug_report() -> dict:
    return {
        "bug_health_score": 100.0,
        "metrics": {
            "total_bugs_reported": 0,
            "open_bugs_count": 0,
            "resolved_bugs_count": 0,
            "avg_resolution_time_hours": 0.0,
            "bug_density_per_kloc": 0.0,
            "duplicate_rate": 0.0,
            "reopened_rate": 0.0,
        },
        "distributions": {
            "priority": {},
            "category": {},
            "status": {},
        },
        "hotspots": [],
        "trend_report": [],
    }
