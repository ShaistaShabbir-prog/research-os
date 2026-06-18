"""Tests for Issue #13: Copilot Chat."""
import os; os.environ.setdefault("ANTHROPIC_API_KEY","sk-ant-demo")
import pytest
from app.services.copilot_chat import chat, suggested_questions, _heuristic_answer

CTX={"paper_title":"Test Paper","reproducibility_score":60,"claim_count":5,"summary":"A test paper."}
HISTORY=[{"role":"user","content":"Hello"},{"role":"assistant","content":"Hi!"}]

class TestCopilot:
    def test_returns_dict(self):
        r=chat("What is the reproducibility score?",HISTORY,CTX)
        assert isinstance(r,dict)
    def test_required_fields(self):
        r=chat("Explain the claims.",HISTORY,CTX)
        for k in ["answer","ai_powered","human_verification_required"]:
            assert k in r
    def test_fallback_mode(self):
        r=chat("Tell me about reproducibility.",HISTORY,CTX)
        assert r["ai_powered"] is False
    def test_empty_question_raises(self):
        with pytest.raises(ValueError): chat("  ",[],CTX)
    def test_no_context(self):
        r=chat("What can you help with?",[])
        assert "answer" in r
    def test_heuristic_repro(self):
        a=_heuristic_answer("reproducibility",CTX)
        assert "reproducib" in a.lower() or "60" in a
    def test_heuristic_claims(self):
        a=_heuristic_answer("claims support",CTX)
        assert len(a)>10
    def test_suggested_questions(self):
        qs=suggested_questions(CTX)
        assert len(qs)>=3 and all(isinstance(q,str) for q in qs)
    def test_low_score_priority_question(self):
        qs=suggested_questions({"reproducibility_score":40})
        assert any("low" in q.lower() or "improv" in q.lower() for q in qs)
    def test_human_verification(self):
        r=chat("Is this paper good?",HISTORY,CTX)
        assert r["human_verification_required"] is True
