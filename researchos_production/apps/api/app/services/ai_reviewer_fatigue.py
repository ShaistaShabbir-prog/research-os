"""Issue #11: AI-powered Reviewer Fatigue upgrade.
Wraps Phase 3 heuristic with Claude for semantic disagreement analysis.
"""
from __future__ import annotations
import json, os, time
from typing import Any
from app.services.reviewer_fatigue import (
    run_reviewer_fatigue as heuristic_run,
    summarize_reviews, generate_ac_briefing,
)

CLAUDE_MODEL = "claude-sonnet-4-6"

def _api_key():
    k = os.getenv("ANTHROPIC_API_KEY","").strip()
    return k if k and not k.startswith("sk-ant-demo") else None

def _call(system, user, max_tokens=1200):
    import httpx
    key = _api_key()
    if not key: return None
    try:
        resp = httpx.post("https://api.anthropic.com/v1/messages",
            headers={"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json"},
            json={"model":CLAUDE_MODEL,"max_tokens":max_tokens,"system":system,"messages":[{"role":"user","content":user}]},
            timeout=30)
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]
    except: return None

def ai_semantic_disagreements(reviews):
    text = json.dumps([{k:v for k,v in r.items() if k in ("reviewer_id","summary","strengths","weaknesses","recommendation")} for r in reviews],indent=2)[:5000]
    sys = """You are an expert Area Chair. Identify SEMANTIC disagreements between reviewers — where they contradict each other on scientific merit, not just tone.
Return JSON: {"semantic_disagreements":[{"dimension":"...","description":"...","reviewer_positions":{"R1":"...","R2":"..."},"severity":"high|medium|low","resolution_hint":"..."}],"hidden_consensus":["..."],"rebuttal_hints":["..."],"ai_powered":true}"""
    raw = _call(sys, f"Reviews:
{text}")
    if not raw: return {"semantic_disagreements":[],"hidden_consensus":[],"rebuttal_hints":[],"ai_powered":False}
    import re
    raw = re.sub(r"^```(?:json)?\s*","",raw.strip()); raw = re.sub(r"\s*```$","",raw.strip())
    try: return json.loads(raw)
    except: return {"semantic_disagreements":[],"hidden_consensus":[],"rebuttal_hints":[],"ai_powered":False}

def ai_decision_scenarios(reviews):
    briefing = generate_ac_briefing(reviews)
    sys = """You are an Area Chair. Given the review summary, generate 3 decision scenarios with probabilities.
Return JSON: {"scenarios":[{"decision":"Accept|Reject|Major Revision|Minor Revision","probability":0.0-1.0,"rationale":"...","conditions":"..."}],"recommended":"...","confidence":0.0-1.0,"ai_powered":true}"""
    raw = _call(sys, f"Briefing:
{json.dumps(briefing,indent=2)[:3000]}")
    if not raw: return {"scenarios":[],"recommended":"Borderline — see AC briefing","confidence":0.5,"ai_powered":False}
    import re
    raw = re.sub(r"^```(?:json)?\s*","",raw.strip()); raw = re.sub(r"\s*```$","",raw.strip())
    try: return json.loads(raw)
    except: return {"scenarios":[],"recommended":"See AC briefing","confidence":0.5,"ai_powered":False}

def run_ai_reviewer_fatigue(document_text, reviews):
    if not reviews: raise ValueError("At least one review required.")
    base = heuristic_run(document_text, reviews)
    ai_dis = ai_semantic_disagreements(reviews)
    ai_dec = ai_decision_scenarios(reviews)
    base["ai_semantic_disagreements"] = ai_dis
    base["ai_decision_scenarios"]     = ai_dec
    base["ai_powered"] = ai_dis.get("ai_powered",False) or ai_dec.get("ai_powered",False)
    base["ethics"].append("AI decision scenarios are probabilistic estimates — AC judgment overrides.")
    return base
