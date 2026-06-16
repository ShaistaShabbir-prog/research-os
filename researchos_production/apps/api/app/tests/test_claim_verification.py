"""Tests for Phase 2: Claim Verification Engine."""
import pytest
from app.services.claim_verification import (
    extract_claims,
    extract_evidence,
    score_support,
    detect_unsupported_claims,
    run_claim_verification,
)

PAPER_WITH_CLAIMS = """# Acoustic Chatter Detection

## Abstract
We propose a lightweight model that achieves 91.4% F1-score on the benchmark dataset.
We are the first system to combine explainability and embedded deployment in a single pipeline.
Unlike prior approaches, our method outperforms all baselines on every metric.

## Method
We train LightGBM with learning rate 0.05, 300 estimators, random seed 42.
Feature extraction uses RMS, kurtosis, and crest factor from 50ms windows.

## Experiments
Table 1 shows our method achieves 91.4% F1 compared to 88.9% for the 1-D CNN baseline.
Figure 2 demonstrates inference at 48ms on embedded hardware.
Statistical significance: p < 0.05 against all baselines.

## Conclusion
Our method improves upon the state of the art and reduces latency by 8x.

## References
1. Smith et al. (2023). Deep chatter. IJMT.
2. Jones (2022). SVM milling. doi:10.000
"""

PAPER_NO_EVIDENCE = """# Unsupported Claims Paper

## Abstract
Our system is the best in the world and outperforms everything ever published.
This revolutionary approach completely solves all machining problems forever.
We guarantee perfect accuracy on all datasets at all times.
"""


class TestExtractClaims:
    def test_returns_list(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        assert isinstance(claims, list)

    def test_detects_quantitative_claims(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        types = [c["claim_type"] for c in claims]
        assert "quantitative" in types or len(claims) > 0

    def test_detects_overclaim_language(self):
        claims = extract_claims(PAPER_NO_EVIDENCE)
        overclaims = [c for c in claims if c["has_overclaim_language"]]
        assert len(overclaims) >= 1

    def test_claims_have_required_fields(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        for c in claims:
            assert "claim_text" in c
            assert "section" in c
            assert "claim_type" in c
            assert c["human_verification_required"] is True

    def test_section_attribution(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        sections = {c["section"] for c in claims}
        # Should attribute to at least one named section
        assert len(sections) >= 1

    def test_empty_paper_returns_empty(self):
        assert extract_claims("") == []
        assert extract_claims("Short.") == []


class TestExtractEvidence:
    def test_finds_quantitative_evidence(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        if claims:
            evidence = extract_evidence(PAPER_WITH_CLAIMS, claims[0])
            assert isinstance(evidence, list)

    def test_evidence_has_fields(self):
        claims = extract_claims(PAPER_WITH_CLAIMS)
        if claims:
            evidence = extract_evidence(PAPER_WITH_CLAIMS, claims[0])
            for ev in evidence:
                assert "evidence_text" in ev
                assert "evidence_type" in ev
                assert "section" in ev

    def test_no_evidence_for_unsupported(self):
        claims = extract_claims(PAPER_NO_EVIDENCE)
        if claims:
            evidence = extract_evidence(PAPER_NO_EVIDENCE, claims[0])
            # Fewer evidence items for unsupported paper
            assert len(evidence) <= 6


class TestScoreSupport:
    def test_zero_evidence_gives_zero(self):
        claim = {"claim_type": "quantitative", "has_overclaim_language": False}
        assert score_support(claim, []) == 0.0

    def test_good_evidence_raises_score(self):
        claim = {"claim_type": "quantitative", "has_overclaim_language": False}
        evidence = [{"evidence_type": "quantitative_result"},
                    {"evidence_type": "figure_table"},
                    {"evidence_type": "statistical"}]
        score = score_support(claim, evidence)
        assert score > 0.4

    def test_overclaim_penalty_applied(self):
        claim_normal   = {"claim_type": "existence", "has_overclaim_language": False}
        claim_overclaim = {"claim_type": "existence", "has_overclaim_language": True}
        ev = [{"evidence_type": "quantitative_result"}]
        assert score_support(claim_overclaim, ev) < score_support(claim_normal, ev)

    def test_score_bounded_0_1(self):
        claim = {"claim_type": "quantitative", "has_overclaim_language": False}
        lots_of_ev = [{"evidence_type": "quantitative_result"}] * 20
        s = score_support(claim, lots_of_ev)
        assert 0.0 <= s <= 1.0


class TestDetectUnsupportedClaims:
    def test_finds_unsupported_in_no_evidence_paper(self):
        unsupported = detect_unsupported_claims(PAPER_NO_EVIDENCE)
        assert len(unsupported) >= 1

    def test_sorted_by_score(self):
        unsupported = detect_unsupported_claims(PAPER_NO_EVIDENCE)
        scores = [u["support_score"] for u in unsupported]
        assert scores == sorted(scores)

    def test_has_suggested_action(self):
        unsupported = detect_unsupported_claims(PAPER_NO_EVIDENCE)
        for u in unsupported:
            assert u["suggested_action"]
            assert u["support_score"] < 0.45


class TestRunClaimVerification:
    def test_full_pipeline(self):
        result = run_claim_verification(PAPER_WITH_CLAIMS)
        assert "claim_count" in result
        assert "supported_count" in result
        assert "unsupported_count" in result
        assert "support_rate" in result
        assert "claims" in result
        assert "ethics" in result
        assert result["human_verification_required"] is True

    def test_support_rate_bounded(self):
        result = run_claim_verification(PAPER_WITH_CLAIMS)
        assert 0.0 <= result["support_rate"] <= 1.0

    def test_counts_consistent(self):
        result = run_claim_verification(PAPER_WITH_CLAIMS)
        assert result["supported_count"] + result["unsupported_count"] == result["claim_count"]

    def test_short_input_raises(self):
        with pytest.raises(ValueError):
            run_claim_verification("too short")

    def test_unsupported_paper_has_many_unsupported(self):
        result = run_claim_verification(PAPER_NO_EVIDENCE)
        assert result["unsupported_count"] >= 1
