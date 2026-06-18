"""Tests for Phase 5: AI-Powered Review Copilot.

All tests run in heuristic fallback mode (no real API key).
The test suite verifies: graceful fallback, schema correctness,
cost estimation, AC report generation, and ethics compliance.
"""
from __future__ import annotations

import json
import os
import pytest

# Force heuristic mode in tests
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-demo-not-real")

from app.services.ai_review_copilot import (
    _api_key,
    _truncate,
    ai_analyze_claims,
    ai_audit_reproducibility,
    ai_generate_meta_review,
    ai_synthesize_reviews,
    estimate_cost,
    run_ai_review_copilot,
)
from app.services.review_copilot import parse_paper

DEMO_PAPER = """# Acoustic Chatter Detection with LightGBM

## Abstract
We propose a lightweight LightGBM pipeline for chatter detection.
We are the first to combine SHAP explanations with embedded deployment at 48ms latency.
Our method achieves 91.4% F1-score on the benchmark. Random seed: 42. Code on GitHub.

## Method
LightGBM with learning rate 0.05, 300 estimators, random_state=42, batch size 16.
SHAP TreeExplainer for feature attributions.

## Experiments
Table 1 shows 91.4% F1 vs 88.9% baseline. Statistical significance: p < 0.05.
Figure 2 shows 48ms inference. Ablation: temporal features add 4.3% F1.

## Conclusion
Reproducible, explainable, embedded-deployable chatter detection.

## References
1. (Smith et al., 2023)
2. (Jones, 2022)
3. (Brown, 2021)
"""

DEMO_REVIEWS = [
    {"reviewer_id": "R1", "summary": "Strong reproducibility. Dataset release is key.",
     "strengths": ["reproducibility", "dataset release"],
     "weaknesses": ["single machine", "no significance test"],
     "recommendation": "weak accept"},
    {"reviewer_id": "R2", "summary": "Good but novelty overstated.",
     "strengths": ["baselines"], "weaknesses": ["novelty overstated"],
     "recommendation": "borderline"},
    {"reviewer_id": "R3", "summary": "Hardware spec missing.",
     "strengths": ["latency focus"], "weaknesses": ["hardware spec missing"],
     "recommendation": "weak reject"},
]


class TestConfig:
    def test_demo_key_detected(self):
        key = _api_key()
        assert key is not None
        assert key.startswith("sk-ant-demo")

    def test_truncate_short(self):
        assert _truncate("hello", 100) == "hello"

    def test_truncate_long(self):
        long_text = "x" * 20_000
        result = _truncate(long_text, 12_000)
        assert len(result) <= 12_200
        assert "truncated" in result

    def test_truncate_exact_limit(self):
        text = "a" * 12_000
        assert _truncate(text) == text


class TestAIAnalyzeClaimsHeuristicFallback:
    """With demo key, must fall back to heuristic gracefully."""

    def setup_method(self):
        self.paper = parse_paper(DEMO_PAPER)
        self.result = ai_analyze_claims(self.paper)

    def test_returns_dict(self):
        assert isinstance(self.result, dict)

    def test_has_findings(self):
        assert "findings" in self.result
        assert isinstance(self.result["findings"], list)

    def test_fallback_mode_flagged(self):
        # In demo/test mode, ai_powered should be False
        assert self.result.get("ai_powered") is False

    def test_findings_have_required_fields(self):
        for f in self.result["findings"]:
            assert "category" in f
            assert "title" in f
            assert "severity" in f
            assert f["human_verification_required"] is True

    def test_fallback_reason_present(self):
        assert "fallback_reason" in self.result


class TestAIReproducibilityHeuristicFallback:
    def setup_method(self):
        self.paper = parse_paper(DEMO_PAPER)
        self.result = ai_audit_reproducibility(self.paper)

    def test_returns_dict(self):
        assert isinstance(self.result, dict)

    def test_has_boolean_checks(self):
        boolean_keys = [k for k, v in self.result.items() if isinstance(v, bool)]
        assert len(boolean_keys) >= 5

    def test_fallback_mode(self):
        assert self.result.get("ai_powered") is False

    def test_random_seed_detected(self):
        assert self.result.get("random_seeds") is True

    def test_hyperparameters_detected(self):
        assert self.result.get("hyperparameters") is True

    def test_findings_human_verification(self):
        for f in self.result.get("findings", []):
            assert f.get("human_verification_required") is True


class TestAISynthesizeReviews:
    def setup_method(self):
        self.result = ai_synthesize_reviews(DEMO_REVIEWS)

    def test_returns_dict(self):
        assert isinstance(self.result, dict)

    def test_has_agreement_points(self):
        assert "agreement_points" in self.result

    def test_has_disagreement_points(self):
        assert "disagreement_points" in self.result

    def test_fallback_mode(self):
        assert self.result.get("ai_powered") is False

    def test_empty_reviews(self):
        result = ai_synthesize_reviews([])
        assert result["agreement_points"] == []
        assert result["ai_powered"] is False

    def test_single_review(self):
        result = ai_synthesize_reviews([DEMO_REVIEWS[0]])
        assert isinstance(result, dict)


class TestAIMetaReview:
    def test_returns_string(self):
        paper = parse_paper(DEMO_PAPER)
        draft = ai_generate_meta_review(DEMO_REVIEWS, paper)
        assert isinstance(draft, str)
        assert len(draft) > 50

    def test_contains_draft_warning(self):
        paper = parse_paper(DEMO_PAPER)
        draft = ai_generate_meta_review(DEMO_REVIEWS, paper)
        assert "draft" in draft.lower() or "DRAFT" in draft or "generated" in draft.lower()

    def test_empty_reviews_returns_string(self):
        paper = parse_paper(DEMO_PAPER)
        draft = ai_generate_meta_review([], paper)
        assert isinstance(draft, str)


class TestCostEstimate:
    def test_returns_dict(self):
        cost = estimate_cost(5000, 3)
        assert isinstance(cost, dict)

    def test_required_fields(self):
        cost = estimate_cost(5000, 3)
        assert "estimated_cost_usd" in cost
        assert "estimated_input_tokens" in cost
        assert "estimated_output_tokens" in cost
        assert "model" in cost

    def test_cost_non_negative(self):
        cost = estimate_cost(5000, 3)
        assert cost["estimated_cost_usd"] >= 0

    def test_larger_paper_costs_more(self):
        small = estimate_cost(1000, 1)
        large = estimate_cost(50000, 5)
        assert large["estimated_cost_usd"] > small["estimated_cost_usd"]

    def test_model_matches_config(self):
        from app.services.ai_review_copilot import CLAUDE_MODEL
        cost = estimate_cost(1000, 1)
        assert cost["model"] == CLAUDE_MODEL


class TestRunAIReviewCopilot:
    def setup_method(self):
        self.result = run_ai_review_copilot(DEMO_PAPER, DEMO_REVIEWS)

    def test_full_pipeline_returns_dict(self):
        assert isinstance(self.result, dict)

    def test_required_top_level_keys(self):
        required = [
            "paper", "claim_audit", "reproducibility_audit",
            "citation_audit", "meta_review", "knowledge_graph",
            "ai_powered", "ai_mode", "model", "elapsed_seconds",
            "cost_estimate", "ethics", "exports",
            "human_verification_required",
        ]
        for key in required:
            assert key in self.result, f"Missing key: {key}"

    def test_heuristic_fallback_mode(self):
        assert self.result["ai_powered"] is False
        assert self.result["ai_mode"] == "heuristic_fallback"

    def test_ethics_has_ai_warning(self):
        ethics_text = " ".join(self.result["ethics"])
        assert "human" in ethics_text.lower() or "verification" in ethics_text.lower()

    def test_exports_present(self):
        exports = self.result["exports"]
        assert "review_analysis.md" in exports
        assert "review_analysis.json" in exports
        assert "review_summary.md" in exports
        assert "meta_review_draft.md" in exports

    def test_exports_json_parseable(self):
        raw = self.result["exports"]["review_analysis.json"]
        data = json.loads(raw)
        assert "paper" in data
        assert "claim_audit" in data

    def test_cost_estimate_present(self):
        cost = self.result["cost_estimate"]
        assert cost["estimated_cost_usd"] >= 0

    def test_elapsed_seconds_reasonable(self):
        assert self.result["elapsed_seconds"] >= 0

    def test_human_verification_required(self):
        assert self.result["human_verification_required"] is True

    def test_knowledge_graph_has_nodes(self):
        assert self.result["knowledge_graph"]["nodes"]

    def test_paper_title_extracted(self):
        assert self.result["paper"]["title"]

    def test_short_input_raises(self):
        with pytest.raises(ValueError):
            run_ai_review_copilot("too short", [])

    def test_result_json_serialisable(self):
        serialised = json.dumps(self.result, default=str)
        parsed = json.loads(serialised)
        assert "paper" in parsed

    def test_no_reviews_allowed(self):
        result = run_ai_review_copilot(DEMO_PAPER, [])
        assert "meta_review" in result
