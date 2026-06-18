"""Tests for Issue #11: AI Reviewer Fatigue."""
import os; os.environ.setdefault("ANTHROPIC_API_KEY","sk-ant-demo")
import pytest
from app.services.ai_reviewer_fatigue import (
    ai_semantic_disagreements, ai_decision_scenarios, run_ai_reviewer_fatigue,
)
REVIEWS=[
    {"reviewer_id":"R1","summary":"Good","strengths":["repro"],"weaknesses":["small dataset"],"recommendation":"weak accept"},
    {"reviewer_id":"R2","summary":"Ok","strengths":["baselines"],"weaknesses":["novelty"],"recommendation":"borderline"},
]
class TestAIFatigue:
    def test_semantic_disagreements(self):
        r=ai_semantic_disagreements(REVIEWS)
        assert "semantic_disagreements" in r and isinstance(r["semantic_disagreements"],list)
    def test_decision_scenarios(self):
        r=ai_decision_scenarios(REVIEWS)
        assert "scenarios" in r and "recommended" in r
    def test_full_pipeline(self):
        r=run_ai_reviewer_fatigue("Paper abstract.",REVIEWS)
        assert "ai_semantic_disagreements" in r and "ai_decision_scenarios" in r
        assert r["human_verification_required"] is True
    def test_empty_raises(self):
        with pytest.raises(ValueError): run_ai_reviewer_fatigue("text",[])
    def test_fallback_mode(self):
        r=run_ai_reviewer_fatigue("text",REVIEWS)
        assert "ai_powered" in r
