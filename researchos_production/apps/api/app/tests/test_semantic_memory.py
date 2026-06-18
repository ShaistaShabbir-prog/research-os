"""Tests for Issue #12: Semantic Memory."""
import pytest
from app.services.semantic_memory import (
    _tfidf_sim, semantic_novelty_overlap, run_semantic_research_memory,
)
PAPERS=[
    {"id":"A","text":"We propose a neural network for text classification achieving 95% accuracy."},
    {"id":"B","text":"Our neural network model achieves high accuracy on text classification tasks."},
    {"id":"C","text":"Quantum computing approaches for protein folding optimization in drug discovery."},
]
class TestTFIDF:
    def test_identical(self): assert _tfidf_sim("hello world","hello world")>0.9
    def test_different(self): assert _tfidf_sim("neural networks","quantum physics")<0.3
    def test_similar(self): assert _tfidf_sim("machine learning model","deep learning model")>0.2
    def test_bounded(self):
        for a,b in [("x","y"),("",""),("abc","abc")]:
            s=_tfidf_sim(a,b); assert 0<=s<=1.001
class TestSemanticOverlap:
    def test_pairs(self):
        r=semantic_novelty_overlap(PAPERS); assert len(r["pairs"])==3
    def test_ab_similar(self):
        r=semantic_novelty_overlap(PAPERS)
        ab=next(p for p in r["pairs"] if p["paper_a"]=="A" and p["paper_b"]=="B")
        assert ab["similarity"]>0.1
    def test_ac_dissimilar(self):
        r=semantic_novelty_overlap(PAPERS)
        ac=next(p for p in r["pairs"] if p["paper_a"]=="A" and p["paper_b"]=="C")
        assert ac["similarity"]<ab_sim(r) if True else True
def ab_sim(r):
    return next(p for p in r["pairs"] if p["paper_a"]=="A" and p["paper_b"]=="B")["similarity"]
class TestFull:
    def test_pipeline(self):
        r=run_semantic_research_memory(PAPERS)
        assert "semantic_novelty_overlap" in r and r["paper_count"]==3
    def test_min_papers(self):
        with pytest.raises(ValueError): run_semantic_research_memory([PAPERS[0]])
    def test_human_verification(self):
        r=run_semantic_research_memory(PAPERS)
        assert r["human_verification_required"] is True
