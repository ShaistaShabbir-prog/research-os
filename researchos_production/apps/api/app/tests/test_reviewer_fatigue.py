"""Tests for Phase 3: Reviewer Fatigue Assistant."""
import pytest
from app.services.reviewer_fatigue import (
    summarize_reviews,
    generate_disagreement_matrix,
    generate_ac_briefing,
    draft_meta_review,
    run_reviewer_fatigue,
)

DEMO_REVIEWS = [
    {
        "reviewer_id": "R1",
        "summary": "Strong reproducibility story. Dataset release is the key contribution.",
        "strengths": ["excellent reproducibility", "dataset release", "SHAP explanations"],
        "weaknesses": ["single machine dataset", "no statistical significance test"],
        "recommendation": "weak accept",
    },
    {
        "reviewer_id": "R2",
        "summary": "Good contribution. Novelty claim in abstract is overstated.",
        "strengths": ["five-baseline comparison", "dataset release"],
        "weaknesses": ["novelty claim overstated", "no concept-drift analysis"],
        "recommendation": "borderline",
    },
    {
        "reviewer_id": "R3",
        "summary": "Embedded deployment claim is unvalidated. Hardware spec missing.",
        "strengths": ["latency focus is novel"],
        "weaknesses": ["hardware spec missing", "no fail-safe discussion"],
        "recommendation": "weak reject",
    },
]

ONE_REVIEW = [DEMO_REVIEWS[0]]


class TestSummarizeReviews:
    def test_returns_one_per_reviewer(self):
        summaries = summarize_reviews(DEMO_REVIEWS)
        assert len(summaries) == 3

    def test_required_fields(self):
        summaries = summarize_reviews(DEMO_REVIEWS)
        for s in summaries:
            assert "reviewer_id" in s
            assert "recommendation" in s
            assert "sentiment" in s
            assert "dimension_coverage" in s
            assert "one_line" in s

    def test_recommendation_scores_ordered(self):
        summaries = summarize_reviews(DEMO_REVIEWS)
        scores = [s["recommendation_score"] for s in summaries]
        # weak accept > borderline > weak reject
        assert scores[0] > scores[1] > scores[2]

    def test_dimension_coverage_present(self):
        summaries = summarize_reviews(DEMO_REVIEWS)
        for s in summaries:
            assert "reproducibility" in s["dimension_coverage"]


class TestDisagreementMatrix:
    def test_matrix_has_all_dimensions(self):
        result = generate_disagreement_matrix(DEMO_REVIEWS)
        for dim in ["reproducibility", "novelty", "baselines"]:
            assert dim in result["matrix"]

    def test_all_reviewers_in_rows(self):
        result = generate_disagreement_matrix(DEMO_REVIEWS)
        for dim, row in result["matrix"].items():
            assert "R1" in row
            assert "R2" in row
            assert "R3" in row

    def test_disagreement_count_non_negative(self):
        result = generate_disagreement_matrix(DEMO_REVIEWS)
        assert result["disagreement_count"] >= 0

    def test_recommendation_spread(self):
        result = generate_disagreement_matrix(DEMO_REVIEWS)
        # weak accept (3) vs weak reject (1) = spread of 2
        assert result["recommendation_spread"] >= 2

    def test_single_reviewer_no_disagreement(self):
        result = generate_disagreement_matrix(ONE_REVIEW)
        assert result["disagreement_count"] == 0


class TestACBriefing:
    def test_required_fields(self):
        briefing = generate_ac_briefing(DEMO_REVIEWS)
        assert "reviewer_count" in briefing
        assert "suggested_decision" in briefing
        assert "recommendation_distribution" in briefing
        assert "consensus_strengths" in briefing
        assert "consensus_weaknesses" in briefing
        assert briefing["human_verification_required"] is True

    def test_reviewer_count_correct(self):
        briefing = generate_ac_briefing(DEMO_REVIEWS)
        assert briefing["reviewer_count"] == 3

    def test_consensus_strengths_subset_of_all(self):
        briefing = generate_ac_briefing(DEMO_REVIEWS)
        # "dataset release" appears in R1 and R2 strengths
        if briefing["consensus_strengths"]:
            assert any("dataset" in s for s in briefing["consensus_strengths"])

    def test_suggested_decision_is_string(self):
        briefing = generate_ac_briefing(DEMO_REVIEWS)
        assert isinstance(briefing["suggested_decision"], str)
        assert len(briefing["suggested_decision"]) > 0


class TestDraftMetaReview:
    def test_returns_markdown_string(self):
        draft = draft_meta_review(DEMO_REVIEWS)
        assert isinstance(draft, str)
        assert "# Meta-Review Draft" in draft

    def test_contains_disclaimer(self):
        draft = draft_meta_review(DEMO_REVIEWS)
        assert "DRAFT" in draft or "generated" in draft.lower()

    def test_contains_suggested_decision(self):
        draft = draft_meta_review(DEMO_REVIEWS)
        assert "Suggested Decision" in draft

    def test_contains_reviewer_lines(self):
        draft = draft_meta_review(DEMO_REVIEWS)
        assert "R1" in draft
        assert "R2" in draft
        assert "R3" in draft


class TestRunReviewerFatigue:
    def test_full_pipeline(self):
        result = run_reviewer_fatigue("Abstract of a demo paper.", DEMO_REVIEWS)
        assert "reviewer_summaries" in result
        assert "disagreement_matrix" in result
        assert "ac_briefing" in result
        assert "meta_review_draft" in result
        assert "exports" in result
        assert "ethics" in result
        assert result["human_verification_required"] is True

    def test_exports_present(self):
        result = run_reviewer_fatigue("Paper text.", DEMO_REVIEWS)
        assert "meta_review_draft.md" in result["exports"]
        assert "ac_briefing.json" in result["exports"]

    def test_empty_reviews_raises(self):
        with pytest.raises(ValueError):
            run_reviewer_fatigue("Paper text.", [])

    def test_meta_review_in_exports_matches_field(self):
        result = run_reviewer_fatigue("Paper text.", DEMO_REVIEWS)
        assert result["exports"]["meta_review_draft.md"] == result["meta_review_draft"]
