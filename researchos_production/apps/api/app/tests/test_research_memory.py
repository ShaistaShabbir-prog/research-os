"""Tests for Phase 4: Research Memory."""
import pytest
from app.services.research_memory import (
    extract_contributions,
    compare_novelty_overlap,
    compare_citation_overlap,
    compare_contribution_overlap,
    run_research_memory,
)

PAPER_A = """# Acoustic Chatter Detection with LightGBM

## Abstract
We propose a lightweight LightGBM pipeline for chatter detection.
We are the first to combine SHAP explanations with embedded deployment.
Our method achieves 91.4% F1.

## Method
LightGBM with SHAP explanations. Dataset collected from DMG MORI machine.

## References
1. Smith et al. (2023)
2. Jones (2022)
3. Brown (2021)
"""

PAPER_B = """# Deep Chatter Detection with ResNet

## Abstract
This paper presents ResNet-34 for chatter detection achieving 94% accuracy.
Our contribution is a large-scale CNC dataset with 10,000 labelled cycles.

## Method
ResNet-34 trained on acoustic emission. GPU inference.

## References
1. Smith et al. (2023)
2. Chen (2024)
4. Lee (2020)
"""

PAPER_C = """# Transformer-Based Machining Stability

## Abstract
We introduce a transformer model for machining stability prediction.
This work contributes a multi-modal sensor fusion framework.
Our system achieves 93% F1 across five machine types.

## Method
Transformer with attention. Combines acoustic and vibration signals.

## References
2. Chen (2024)
5. Wang (2021)
6. Kim (2022)
"""

PAPERS = [
    {"id": "PaperA", "text": PAPER_A},
    {"id": "PaperB", "text": PAPER_B},
    {"id": "PaperC", "text": PAPER_C},
]


class TestExtractContributions:
    def test_finds_contributions(self):
        contribs = extract_contributions(PAPER_A)
        assert isinstance(contribs, list)
        assert len(contribs) >= 1

    def test_required_fields(self):
        contribs = extract_contributions(PAPER_A)
        for c in contribs:
            assert "text" in c
            assert "section" in c
            assert "is_first_claim" in c

    def test_first_claim_detected(self):
        contribs = extract_contributions(PAPER_A)
        first_claims = [c for c in contribs if c["is_first_claim"]]
        assert len(first_claims) >= 1

    def test_empty_returns_empty(self):
        assert extract_contributions("") == []


class TestNoveltyOverlap:
    def test_pairwise_pairs(self):
        result = compare_novelty_overlap(PAPERS)
        assert len(result["pairs"]) == 3  # C(3,2) = 3

    def test_similarity_bounded(self):
        result = compare_novelty_overlap(PAPERS)
        for pair in result["pairs"]:
            assert 0.0 <= pair["similarity"] <= 1.0

    def test_pair_fields(self):
        result = compare_novelty_overlap(PAPERS)
        for pair in result["pairs"]:
            assert "paper_a" in pair
            assert "paper_b" in pair
            assert "similarity" in pair
            assert "shared_concepts" in pair
            assert "overlap_label" in pair

    def test_concept_sets_present(self):
        result = compare_novelty_overlap(PAPERS)
        assert "PaperA" in result["concept_sets"]
        assert "PaperB" in result["concept_sets"]
        assert "PaperC" in result["concept_sets"]

    def test_most_least_similar(self):
        result = compare_novelty_overlap(PAPERS)
        assert result["most_similar"] is not None
        assert result["least_similar"] is not None
        assert result["most_similar"]["similarity"] >= result["least_similar"]["similarity"]


class TestCitationOverlap:
    def test_pairwise_pairs(self):
        result = compare_citation_overlap(PAPERS)
        assert len(result["pairs"]) == 3

    def test_ab_share_smith(self):
        result = compare_citation_overlap(PAPERS)
        ab = next(p for p in result["pairs"] if p["paper_a"] == "PaperA" and p["paper_b"] == "PaperB")
        # Smith et al. (2023) in both A and B
        assert ab["shared_count"] >= 1

    def test_citation_counts_present(self):
        result = compare_citation_overlap(PAPERS)
        for pid in ["PaperA", "PaperB", "PaperC"]:
            assert pid in result["citation_counts"]

    def test_similarity_bounded(self):
        result = compare_citation_overlap(PAPERS)
        for pair in result["pairs"]:
            assert 0.0 <= pair["similarity"] <= 1.0


class TestContributionOverlap:
    def test_comparison_has_all_papers(self):
        result = compare_contribution_overlap(PAPERS)
        ids = {c["paper_id"] for c in result["comparison"]}
        assert "PaperA" in ids
        assert "PaperB" in ids

    def test_first_claims_dict(self):
        result = compare_contribution_overlap(PAPERS)
        assert "first_claims" in result
        # Paper A claims to be first
        assert len(result["first_claims"].get("PaperA", [])) >= 1

    def test_overlap_warnings_list(self):
        result = compare_contribution_overlap(PAPERS)
        assert isinstance(result["overlap_warnings"], list)


class TestRunResearchMemory:
    def test_full_pipeline(self):
        result = run_research_memory(PAPERS)
        assert result["paper_count"] == 3
        assert "novelty_overlap" in result
        assert "citation_overlap" in result
        assert "contribution_overlap" in result
        assert "summary" in result
        assert "exports" in result
        assert result["human_verification_required"] is True

    def test_exports_json(self):
        result = run_research_memory(PAPERS)
        assert "research_memory.json" in result["exports"]
        import json
        data = json.loads(result["exports"]["research_memory.json"])
        assert "papers" in data

    def test_summary_has_all_papers(self):
        result = run_research_memory(PAPERS)
        ids = {s["id"] for s in result["summary"]}
        assert "PaperA" in ids
        assert "PaperB" in ids
        assert "PaperC" in ids

    def test_two_papers_minimum(self):
        with pytest.raises(ValueError):
            run_research_memory([PAPERS[0]])

    def test_auto_assigns_ids(self):
        papers_no_id = [{"text": PAPER_A}, {"text": PAPER_B}]
        result = run_research_memory(papers_no_id)
        assert result["paper_count"] == 2

    def test_ethics_present(self):
        result = run_research_memory(PAPERS)
        assert len(result["ethics"]) >= 1
