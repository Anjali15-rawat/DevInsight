"""
Unit tests for AI Agents, AgentRegistry, and providers.
"""
import pytest
from unittest.mock import MagicMock

from app.agents.base_agent import agent_registry, BaseAgent
from app.schemas.agent_contracts import AgentInput, AgentFinding
import app.agents.orchestrator


def test_agent_registry_registration():
    """
    Ensure all required agents are correctly registered in the global registry.
    """
    expected_agents = ["code_quality", "security", "performance", "bug_triage", "root_cause", "knowledge"]
    for agent_type in expected_agents:
        agent = agent_registry.get_agent(agent_type)
        assert agent is not None
        assert agent.agent_type == agent_type
        assert isinstance(agent, BaseAgent)


def test_parse_json_safely():
    """
    Test BaseAgent's static JSON parsing logic, including handling of markdown code fences.
    """
    raw_json = '{"summary": "Test summary", "findings": []}'
    parsed = BaseAgent.parse_json_safely(raw_json)
    assert parsed == {"summary": "Test summary", "findings": []}

    # With json code fence
    raw_json_fence = '```json\n{"summary": "Test summary 2", "findings": []}\n```'
    parsed_fence = BaseAgent.parse_json_safely(raw_json_fence)
    assert parsed_fence == {"summary": "Test summary 2", "findings": []}

    # With simple code fence
    raw_simple_fence = '```\n{"summary": "Test summary 3", "findings": []}\n```'
    parsed_simple = BaseAgent.parse_json_safely(raw_simple_fence)
    assert parsed_simple == {"summary": "Test summary 3", "findings": []}


def test_truncate_diff():
    """
    Test diff truncation logic to avoid token size limit errors.
    """
    long_diff = "a" * 100
    truncated = BaseAgent.truncate_diff(long_diff, max_chars=50)
    assert truncated.startswith("a" * 50)
    assert "[DIFF TRUNCATED" in truncated
