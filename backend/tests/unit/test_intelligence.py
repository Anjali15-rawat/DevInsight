"""
Unit tests for the Engineering Intelligence Engine.
Tests all score calculations, metrics calculation, and caching mechanisms.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.intelligence.scoring import (
    calculate_repository_health_score,
    calculate_code_quality_score,
    calculate_security_score,
    calculate_maintainability_score,
    calculate_technical_debt_score,
    calculate_developer_productivity_score,
    calculate_review_quality_score,
)
from app.services.intelligence.cache import intelligence_cache


def test_scoring_framework_boundaries():
    """
    Ensure all scores are safely bounded within [0.0, 100.0] and format correctly.
    """
    # Repository Health
    assert calculate_repository_health_score(150.0, 120.0, 110.0, 95.0) == 100.0
    assert calculate_repository_health_score(-10.0, -50.0, 0.0, 0.0) == 0.0

    # Code Quality
    assert calculate_code_quality_score(None, 0.0) == 82.0  # 0.6 * 70 + 0.4 * 100 = 82
    assert calculate_code_quality_score(95.0, 10.0) == 57.0  # 0.6 * 95 + 0.4 * 0 = 57.0

    # Security
    assert calculate_security_score(0, 0, 0) == 100.0
    assert calculate_security_score(10, 5, 20) == 0.0  # negative capped at 0

    # Maintainability
    assert calculate_maintainability_score(0.0, 0.0, 0.0) == 100.0
    assert calculate_maintainability_score(10.0, 5.0, 1.0) == 0.0

    # Developer Productivity
    assert calculate_developer_productivity_score(100, 100, 100) == 100.0
    assert calculate_developer_productivity_score(0, 0, 0) == 0.0


def test_review_quality_score():
    """
    Verify review quality calculations based on accepted rate and speed.
    """
    # 100% accepted, fast review
    assert calculate_review_quality_score(5, 0, 2.0) == 100.0
    # 50% accepted, slow review (> 48 hrs)
    assert calculate_review_quality_score(5, 5, 50.0) == 25.0  # 0.5 * 0.5 * 100


@pytest.mark.asyncio
async def test_cache_lazy_evaluation():
    """
    Test that intelligence_cache lazily evaluates and caches queries.
    """
    # Clear cache first
    await intelligence_cache.clear_all()

    calc_count = 0

    async def mock_calculator():
        nonlocal calc_count
        calc_count += 1
        return {"value": 42}

    key = "test:lazy_eval_key"

    # First call: cache miss, triggers calculation
    res1 = await intelligence_cache.get_or_calculate(key, mock_calculator)
    assert res1 == {"value": 42}
    assert calc_count == 1

    # Second call: cache hit, bypasses calculation
    res2 = await intelligence_cache.get_or_calculate(key, mock_calculator)
    assert res2 == {"value": 42}
    assert calc_count == 1

    # Third call: bypass cache, forces recalculation
    res3 = await intelligence_cache.get_or_calculate(key, mock_calculator, bypass_cache=True)
    assert res3 == {"value": 42}
    assert calc_count == 2
