"""
Scoring Framework — computes independent, modular engineering health and quality scores.

Scores are normalized on a scale of 0 to 100, where 100 represents the highest quality / health.
Weights are defined in a configurable ScoringWeights class.
"""
from typing import Any


class ScoringWeights:
    # Repository Health components
    repo_quality: float = 0.3
    repo_security: float = 0.3
    repo_activity: float = 0.2
    repo_maintainability: float = 0.2

    # Engineering Health components
    eng_pr_velocity: float = 0.3
    eng_review_speed: float = 0.3
    eng_build_status: float = 0.2
    eng_dev_engagement: float = 0.2

    # Technical Debt components
    debt_code_smells: float = 0.2
    debt_todos: float = 0.2
    debt_long_lived_branches: float = 0.2
    debt_large_prs: float = 0.2
    debt_repeated_bugs: float = 0.2


# ─── Scoring Helpers ──────────────────────────────────────────────────────────

def calculate_repository_health_score(
    code_quality_score: float,
    security_score: float,
    activity_score: float,
    maintainability_score: float,
    weights: ScoringWeights = ScoringWeights(),
) -> float:
    """
    Computes overall Repository Health Score as a weighted average.
    """
    score = (
        weights.repo_quality * code_quality_score
        + weights.repo_security * security_score
        + weights.repo_activity * activity_score
        + weights.repo_maintainability * maintainability_score
    )
    return round(max(0.0, min(100.0, score)), 1)


def calculate_engineering_health_score(
    pr_velocity_score: float,
    review_speed_score: float,
    build_status_score: float,
    dev_engagement_score: float,
    weights: ScoringWeights = ScoringWeights(),
) -> float:
    """
    Computes overall Engineering Health Score for team analytics.
    """
    score = (
        weights.eng_pr_velocity * pr_velocity_score
        + weights.eng_review_speed * review_speed_score
        + weights.eng_build_status * build_status_score
        + weights.eng_dev_engagement * dev_engagement_score
    )
    return round(max(0.0, min(100.0, score)), 1)


def calculate_code_quality_score(
    code_coverage: float | None,
    quality_findings_density: float,  # findings per PR/file
) -> float:
    """
    Computes Code Quality Score based on test coverage and finding density.
    If coverage is None, defaults to a neutral baseline of 70.0.
    """
    coverage = code_coverage if code_coverage is not None else 70.0
    # Higher finding density reduces the score. Each finding reduces score by 15 points.
    findings_penalty = min(100.0, 15.0 * quality_findings_density)
    quality_from_findings = 100.0 - findings_penalty

    score = 0.6 * coverage + 0.4 * quality_from_findings
    return round(max(0.0, min(100.0, score)), 1)


def calculate_security_score(
    critical_findings: int,
    warning_findings: int,
    repo_security_alerts: int,
) -> float:
    """
    Computes Security Score. Penalizes critical, warning findings and repo alerts.
    """
    penalty = (25.0 * critical_findings) + (10.0 * warning_findings) + (5.0 * repo_security_alerts)
    score = 100.0 - penalty
    return round(max(0.0, min(100.0, score)), 1)


def calculate_maintainability_score(
    code_smells_density: float,  # smells per PR/file
    todos_density: float,        # TODOs per PR/file
    large_pr_ratio: float,       # proportion of PRs > 500 lines (0.0 to 1.0)
) -> float:
    """
    Computes Maintainability Score based on code smells, TODO counts, and PR size.
    """
    penalty = (15.0 * code_smells_density) + (10.0 * todos_density) + (20.0 * large_pr_ratio)
    score = 100.0 - penalty
    return round(max(0.0, min(100.0, score)), 1)


def calculate_performance_score(
    critical_perf_findings: int,
    warning_perf_findings: int,
) -> float:
    """
    Computes Performance Score based on performance-related findings.
    """
    penalty = (30.0 * critical_perf_findings) + (10.0 * warning_perf_findings)
    score = 100.0 - penalty
    return round(max(0.0, min(100.0, score)), 1)


def calculate_technical_debt_score(
    code_smells_score: float,       # 0 to 100 (high is good)
    todos_score: float,             # 0 to 100 (high is good/few todos)
    long_lived_branches_score: float,  # 0 to 100 (high is good/few long-lived branches)
    large_prs_score: float,         # 0 to 100 (high is good/few large PRs)
    repeated_bugs_score: float,     # 0 to 100 (high is good/few repeated bugs)
    weights: ScoringWeights = ScoringWeights(),
) -> float:
    """
    Computes Technical Debt Score. 100.0 represents NO tech debt, 0.0 represents extreme tech debt.
    """
    score = (
        weights.debt_code_smells * code_smells_score
        + weights.debt_todos * todos_score
        + weights.debt_long_lived_branches * long_lived_branches_score
        + weights.debt_large_prs * large_prs_score
        + weights.debt_repeated_bugs * repeated_bugs_score
    )
    return round(max(0.0, min(100.0, score)), 1)


def calculate_developer_productivity_score(
    commits_count: int,
    prs_merged: int,
    reviews_given: int,
    target_commits: int = 20,
    target_prs: int = 5,
    target_reviews: int = 10,
) -> float:
    """
    Computes Developer Productivity/Engagement Score based on activity targets.
    """
    commits_ratio = min(1.0, commits_count / max(1, target_commits))
    prs_ratio = min(1.0, prs_merged / max(1, target_prs))
    reviews_ratio = min(1.0, reviews_given / max(1, target_reviews))

    score = (0.4 * commits_ratio + 0.3 * prs_ratio + 0.3 * reviews_ratio) * 100.0
    return round(max(0.0, min(100.0, score)), 1)


def calculate_review_quality_score(
    accepted_findings: int,
    false_positives: int,
    avg_review_time_hours: float,
) -> float:
    """
    Computes Review Quality Score based on finding acceptance rate and speed.
    """
    total = accepted_findings + false_positives
    if total == 0:
        acceptance_rate = 1.0  # clean slate
    else:
        acceptance_rate = accepted_findings / total

    # Faster reviews get a higher score.
    # > 48 hours is penalized. < 4 hours is optimal.
    if avg_review_time_hours <= 4.0:
        speed_modifier = 1.0
    elif avg_review_time_hours <= 24.0:
        speed_modifier = 0.9
    elif avg_review_time_hours <= 48.0:
        speed_modifier = 0.7
    else:
        speed_modifier = 0.5

    score = acceptance_rate * speed_modifier * 100.0
    return round(max(0.0, min(100.0, score)), 1)


def calculate_documentation_coverage_score(
    doc_gap_findings_count: int,
    total_files: int = 50,
) -> float:
    """
    Computes Documentation Coverage Score. Gap findings lower the score.
    """
    # Normalize density of doc gaps relative to total files
    density = doc_gap_findings_count / max(1, total_files)
    penalty = min(100.0, 200.0 * density)  # 1 gap in 10 files = 20% penalty
    score = 100.0 - penalty
    return round(max(0.0, min(100.0, score)), 1)
