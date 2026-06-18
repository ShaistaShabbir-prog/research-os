"""Issue #13: ResearchOS Copilot Chat.
Context-aware research assistant — knows the current paper and analyses.
Heuristic fallback when Claude unavailable.
"""
from __future__ import annotations
import json, os, re
from typing import Any

CLAUDE_MODEL = "claude-sonnet-4-6"
MAX_HISTORY  = 10

def _api_key():
    k = os.getenv("ANTHROPIC_API_KEY","").strip()
    return k if k and not k.startswith("sk-ant-demo") else None

def _call_claude(system, messages, max_tokens=800):
    import httpx
    key = _api_key()
    if not key: return None
    try:
        resp = httpx.post("https://api.anthropic.com/v1/messages",
            headers={"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json"},
            json={"model":CLAUDE_MODEL,"max_tokens":max_tokens,"system":system,"messages":messages[-MAX_HISTORY:]},
            timeout=30)
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]
    except: return None

def _heuristic_answer(question: str, context: dict) -> str:
    q = question.lower()
    title = context.get("paper_title","the paper")
    if any(w in q for w in ["reproducib","seed","code","dataset"]):
        repro = context.get("reproducibility_score",50)
        return f"Based on heuristic analysis, {title} has a reproducibility score of {repro}%. Key checklist items are available in the reproducibility audit tab."
    if any(w in q for w in ["claim","support","evidence"]):
        return f"The claim audit found several items requiring human verification in {title}. Review the Claim Audit tab for details."
    if any(w in q for w in ["review","disagree","reviewer"]):
        return f"The reviewer analysis identified agreement and disagreement points. See the Reviewer Consensus tab for the full breakdown."
    if any(w in q for w in ["cost","price","how much"]):
        return "Each AI analysis run costs approximately $0.004–$0.01 USD depending on paper length. Heuristic mode is free."
    return f"I can help you understand the analysis of {title}. Ask me about reproducibility, claims, reviewer consensus, or methodology. For deeper analysis, enable AI mode."

def chat(question: str, history: list[dict], context: dict | None = None) -> dict[str, Any]:
    """
    Single-turn chat with paper context.
    history: [{"role":"user"|"assistant","content":"..."}]
    context: {"paper_title":..., "reproducibility_score":..., "claim_count":..., "summary":...}
    """
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")
    
    ctx = context or {}
    paper_ctx = ""
    if ctx:
        paper_ctx = f"""
Current paper context:
- Title: {ctx.get("paper_title","Unknown")}
- Reproducibility score: {ctx.get("reproducibility_score","N/A")}%
- Claim count: {ctx.get("claim_count","N/A")}
- Summary: {ctx.get("summary","Not available")[:400]}
"""
    system = f"""You are ResearchOS Copilot — a research assistant specialising in academic peer review quality.
You help reviewers, area chairs, supervisors, and students understand paper analyses.
Be concise (2-4 sentences), precise, and always remind users that outputs require human verification.
Never fabricate specific numbers or citations — only reference what is in the context provided.
If you don't know, say so clearly.
{paper_ctx}"""

    messages = list(history) + [{"role":"user","content":question}]
    ai_response = _call_claude(system, messages)
    
    if ai_response:
        return {
            "answer":    ai_response,
            "ai_powered": True,
            "model":     CLAUDE_MODEL,
            "human_verification_required": True,
        }
    
    # Heuristic fallback
    return {
        "answer":    _heuristic_answer(question, ctx),
        "ai_powered": False,
        "model":     "heuristic",
        "fallback_reason": "Claude API unavailable",
        "human_verification_required": True,
    }

def suggested_questions(context: dict | None = None) -> list[str]:
    """Return contextual suggested questions."""
    base = [
        "What are the main reproducibility gaps in this paper?",
        "Which claims are unsupported by evidence?",
        "What do reviewers agree on?",
        "What should the authors clarify in their rebuttal?",
        "How does the reproducibility score compare to typical papers?",
    ]
    if context and context.get("reproducibility_score",100) < 60:
        base.insert(0,"Why is the reproducibility score low and how can it be improved?")
    return base[:5]
