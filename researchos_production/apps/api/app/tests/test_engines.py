"""Tests for all three engines."""
import pytest
from app.services.supervisor_engine import review_document
from app.services.dataset_engine import create_dataset_card, reproducibility_check
from app.services.graph_engine import extract_graph

SAMPLE = """
Abstract
This paper proposes a novel CNN-based approach for chatter detection in CNC milling.

Introduction
Machining stability is a critical research gap in manufacturing intelligence [Smith et al., 2023].
Previous work [Jones, 2022] shows acoustic signals carry chatter-relevant information.

Methodology
We collected a dataset from 5 CNC machines using PCB and low-cost microphones.
Baselines include SVM and Random Forest. The experiment uses 5-fold cross-validation
with F1-score and accuracy metrics. Code is available at github.com/example/repo.
Environment: requirements.txt and Docker image provided. Seed: 42.

Results
CNN achieves 94.2% accuracy, outperforming the SVM baseline by 8.3%.
See Figure 1 and Table 2 for full results.

Discussion
The results confirm the contribution's validity across multiple cutting conditions.

Limitations
The dataset is limited to steel workpieces at fixed spindle speeds.

Conclusion
We proposed a novel chatter detection method using low-cost acoustic monitoring.

References
[1] Smith et al., 2023. Machining Stability. Journal of Manufacturing.
[2] Jones, 2022. Acoustic Monitoring. CIRP Annals.
"""


def test_supervisor_returns_all_fields():
    r = review_document(SAMPLE)
    assert "overall_score" in r
    assert "scores" in r
    assert len(r["scores"]) == 6
    assert "decision" in r
    assert "major_concerns" in r
    assert "defense_questions" in r
    assert "next_actions" in r


def test_supervisor_score_range():
    r = review_document(SAMPLE)
    assert 0 <= r["overall_score"] <= 10
    for s in r["scores"]:
        assert 0 <= s["value"] <= 10


def test_supervisor_detects_sections():
    r = review_document(SAMPLE)
    sp = r["section_presence"]
    assert sp["methodology"] is True
    assert sp["abstract"] is True
    assert sp["results"] is True
    assert sp["limitations"] is True


def test_supervisor_defense_mode():
    r = review_document(SAMPLE, mode="defense")
    assert "What is the single most important contribution" in r["defense_questions"][0]


def test_dataset_card_fields():
    card = create_dataset_card(
        name="CNC Milling Dataset",
        abstract="Acoustic signals from CNC milling experiments",
        files=["data.csv", "README.md", "LICENSE", "requirements.txt"],
        license="CC-BY-4.0",
        domain="manufacturing",
    )
    assert card["name"] == "CNC Milling Dataset"
    assert ".csv" in card["formats_detected"]
    assert card["license"] == "CC-BY-4.0"


def test_reproducibility_good():
    score, issues = reproducibility_check([
        "data.csv", "README.md", "LICENSE", "requirements.txt", "metadata.json", "CITATION.cff"
    ])
    assert score == 100.0
    assert issues == []


def test_reproducibility_poor():
    score, issues = reproducibility_check(["analysis.py"])
    assert score < 75
    assert any("data" in i.lower() for i in issues)
    assert any("README" in i for i in issues)


def test_graph_extracts_methods():
    result = extract_graph("Test Paper", SAMPLE)
    labels = [n["label"] for n in result["nodes"]]
    assert "Method" in labels
    methods = [n["name"] for n in result["nodes"] if n["label"] == "Method"]
    assert any(m.upper() in ("CNN", "SVM") for m in methods)


def test_graph_has_edges():
    result = extract_graph("Test Paper", SAMPLE)
    assert len(result["edges"]) > 0
    relations = [e["relation"] for e in result["edges"]]
    assert "USES_METHOD" in relations
