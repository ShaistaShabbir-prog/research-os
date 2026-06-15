from app.services.review_copilot import (
    audit_claims,
    audit_citations,
    audit_reproducibility,
    parse_paper,
    run_review_copilot,
    synthesize_meta_review,
    validate_review_copilot_input,
)


DEMO_PAPER = """# Synthetic Efficient Review Networks

## Abstract
We are the first system to improve reviewer calibration on a synthetic benchmark.

## Method
The system uses a parser and classifier. We train for 10 epochs with learning rate 0.001.

## Experiments
We compare against two baselines on a Synthetic Dataset. Table 1 reports accuracy.

## References
1. Doe, J. Synthetic Peer Review Benchmarks. Journal of Toy Evaluation. 2024. doi:10.0000/demo
"""


def test_section_parsing_extracts_paper_structure():
    paper = parse_paper(DEMO_PAPER)
    assert paper["title"] == "Synthetic Efficient Review Networks"
    assert paper["abstract"].startswith("We are the first")
    assert [section["title"] for section in paper["sections"]] == ["Method", "Experiments"]
    assert len(paper["references"]) == 1


def test_citation_audit_flags_sparse_coverage():
    paper = parse_paper(DEMO_PAPER)
    report = audit_citations(paper)
    assert report["report_type"] == "citation_audit"
    assert any(item["category"] == "weak_citation_coverage" for item in report["findings"])


def test_reproducibility_checklist_detects_present_and_missing_items():
    paper = parse_paper(DEMO_PAPER)
    checklist = audit_reproducibility(paper)
    assert checklist["dataset_availability"] is True
    assert checklist["baselines"] is True
    assert checklist["hyperparameters"] is True
    assert checklist["code_availability"] is False
    assert all(item["human_verification_required"] for item in checklist["findings"])


def test_claim_audit_schema_has_evidence_and_human_flag():
    paper = parse_paper(DEMO_PAPER)
    report = audit_claims(paper)
    assert report["findings"]
    first = report["findings"][0]
    assert first["confidence"] is not None
    assert first["evidence_span"]["text"]
    assert first["section_reference"]
    assert first["human_verification_required"] is True


def test_meta_review_synthesis_finds_agreement_and_disagreement():
    meta = synthesize_meta_review(
        [
            {
                "reviewer_id": "R1",
                "summary": "Important but incomplete.",
                "strengths": ["important problem"],
                "weaknesses": ["missing seeds"],
                "recommendation": "accept",
            },
            {
                "reviewer_id": "R2",
                "summary": "Important problem with baseline gaps.",
                "strengths": ["important problem"],
                "weaknesses": ["missing baselines"],
                "recommendation": "reject",
            },
        ]
    )
    assert meta["agreement_points"]
    assert meta["disagreement_points"]
    assert meta["human_verification_required"] is True


def test_full_review_copilot_result_includes_exports_and_kg():
    result = run_review_copilot(DEMO_PAPER, [])
    assert "review_summary.md" in result["exports"]
    assert "review_analysis.md" in result["exports"]
    assert "review_analysis.json" in result["exports"]
    assert "research_kg.graphml" in result["exports"]
    assert result["knowledge_graph"]["nodes"]
    assert result["ethics"]


def test_input_validation_rejects_short_text():
    try:
        validate_review_copilot_input("too short")
    except ValueError as exc:
        assert "at least" in str(exc)
    else:
        raise AssertionError("short input should fail validation")


def test_parser_falls_back_to_full_text_section_without_headings():
    paper = parse_paper("This is a plain text paper draft with enough content to parse safely but no marked headings.")
    assert paper["sections"][0]["title"] == "Full Text"
