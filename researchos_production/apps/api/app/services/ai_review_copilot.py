"""Phase 5: AI-Powered Review Copilot — Claude API integration.

Wraps the existing heuristic pipeline with live Claude calls for
deeper, context-aware analysis. Falls back to heuristic if API
key is missing or call fails. All outputs remain gated behind
human_verification_required = True.
"""
from __future__ import annotations

import json
import os
import re
import time
from typing import Any

import httpx

from app.services.review_copilot import (
    ETHICS_WARNINGS,
    audit_citations,
    audit_claims,
    audit_reproducibility,
    parse_paper,
    run_review_copilot as heuristic_run,
    synthesize_meta_review,
)

# ── Config ────────────────────────────────────────────────────────────────
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL      = "claude-sonnet-4-6"
MAX_TOKENS        = 1500
TIMEOUT_S         = 30
MAX_PAPER_CHARS   = 12_000   # truncate before sending to API


def _api_key() -> str | None:
    return os.getenv("ANTHROPIC_API_KEY", "").strip() or None


def _truncate(text: str, limit: int = MAX_PAPER_CHARS) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n\n[... truncated for AI analysis ...]"


# ── Core Claude caller ────────────────────────────────────────────────────

def _call_claude(system: str, user: str, max_tokens: int = MAX_TOKENS) -> str | None:
    """Call Claude API. Returns text or None on any failure."""
    key = _api_key()
    if not key or key.startswith("sk-ant-demo"):
        return None
    try:
        resp = httpx.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key":         key,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json={
                "model":      CLAUDE_MODEL,
                "max_tokens": max_tokens,
                "system":     system,
                "messages":   [{"role": "user", "content": user}],
            },
            timeout=TIMEOUT_S,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]
    except Exception:
        return None


def _call_claude_json(system: str, user: str, max_tokens: int = MAX_TOKENS) -> dict | list | None:
    """Call Claude and parse JSON response. Returns None on failure."""
    system_json = (
        system
        + "\n\nIMPORTANT: Respond with valid JSON only. "
        "No markdown, no code fences, no preamble."
    )
    raw = _call_claude(system_json, user, max_tokens)
    if not raw:
        return None
    # Strip accidental fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$",          "", raw.strip())
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


# ── AI analysis modules ───────────────────────────────────────────────────

def ai_analyze_claims(paper: dict[str, Any]) -> dict[str, Any]:
    """Claude-powered claim analysis — deeper than regex heuristics."""
    text = _truncate(paper.get("raw_text", ""))
    system = """You are an expert academic peer reviewer specialising in research integrity.
Your task: analyse claims in a research paper and identify which are well-supported vs unsupported.

Return JSON with this exact structure:
{
  "findings": [
    {
      "category": "overclaiming|unsupported|speculative|well_supported",
      "title": "short title",
      "description": "explanation under 200 chars",
      "section_reference": "section name",
      "suggested_action": "what author should do",
      "severity": "high|medium|low",
      "confidence": 0.0-1.0,
      "human_verification_required": true
    }
  ],
  "overall_claim_quality": "strong|moderate|weak",
  "ai_powered": true
}"""
    result = _call_claude_json(system,
        f"Analyse claims in this paper:\n\n{text}")
    if result and "findings" in result:
        return result
    # Fallback to heuristic
    heuristic = audit_claims(paper)
    heuristic["ai_powered"] = False
    heuristic["fallback_reason"] = "Claude API unavailable — heuristic mode"
    return heuristic


def ai_audit_reproducibility(paper: dict[str, Any]) -> dict[str, Any]:
    """Claude-powered reproducibility audit."""
    text = _truncate(paper.get("raw_text", ""))
    system = """You are an expert in ML reproducibility and research transparency.
Audit this paper against the NeurIPS reproducibility checklist.

Return JSON with this exact structure:
{
  "code_availability": true|false,
  "dataset_availability": true|false,
  "preprocessing_details": true|false,
  "hyperparameters": true|false,
  "random_seeds": true|false,
  "hardware_software_environment": true|false,
  "baselines": true|false,
  "ablations": true|false,
  "statistical_significance": true|false,
  "limitations": true|false,
  "findings": [
    {
      "category": "reproducibility",
      "title": "short title",
      "description": "explanation under 200 chars",
      "section_reference": "section name",
      "suggested_action": "what to add",
      "severity": "high|medium|low",
      "confidence": 0.0-1.0,
      "human_verification_required": true
    }
  ],
  "reproducibility_score": 0-100,
  "ai_powered": true
}"""
    result = _call_claude_json(system,
        f"Audit reproducibility of this paper:\n\n{text}")
    if result and "findings" in result:
        return result
    heuristic = audit_reproducibility(paper)
    heuristic["ai_powered"] = False
    heuristic["fallback_reason"] = "Claude API unavailable — heuristic mode"
    return heuristic


def ai_synthesize_reviews(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    """Claude-powered reviewer consensus — genuine NLU, not keyword matching."""
    if not reviews:
        return {"agreement_points": [], "disagreement_points": [],
                "missing_discussion_points": [], "ai_powered": False}

    reviews_text = json.dumps([
        {k: v for k, v in r.items() if k in
         ("reviewer_id","summary","strengths","weaknesses","recommendation")}
        for r in reviews
    ], indent=2)[:6000]

    system = """You are an Area Chair synthesising peer reviews for a scientific paper.
Identify genuine agreements, disagreements, and missing discussion points.

Return JSON with this exact structure:
{
  "agreement_points": [
    {"title": "...", "description": "...", "reviewer_ids": ["R1","R2"],
     "human_verification_required": true}
  ],
  "disagreement_points": [
    {"title": "...", "description": "...", "reviewer_ids": ["R1","R3"],
     "severity": "high|medium|low", "human_verification_required": true}
  ],
  "missing_discussion_points": [
    {"title": "...", "description": "...", "human_verification_required": true}
  ],
  "balanced_meta_review": "2-3 sentence balanced summary for AC",
  "author_clarification_questions": [
    {"title": "...", "description": "...", "human_verification_required": true}
  ],
  "confidence": 0.0-1.0,
  "ai_powered": true,
  "human_verification_required": true
}"""
    result = _call_claude_json(system,
        f"Synthesise these peer reviews:\n\n{reviews_text}", max_tokens=1200)
    if result and "agreement_points" in result:
        return result
    heuristic = synthesize_meta_review(reviews)
    heuristic["ai_powered"] = False
    heuristic["fallback_reason"] = "Claude API unavailable — heuristic mode"
    return heuristic


def ai_generate_meta_review(
    reviews: list[dict[str, Any]],
    paper: dict[str, Any],
) -> str:
    """Claude drafts a structured meta-review for the AC to edit."""
    reviews_text = json.dumps([
        {k: v for k, v in r.items()
         if k in ("reviewer_id","summary","strengths","weaknesses","recommendation")}
        for r in reviews
    ], indent=2)[:4000]

    paper_context = f"Title: {paper.get('title','Unknown')}\nAbstract: {paper.get('abstract','')[:600]}"

    system = """You are an Area Chair writing a meta-review for a scientific paper.
Draft a professional, balanced meta-review that:
- Summarises reviewer consensus (strengths AND weaknesses)
- Notes key disagreements
- States a suggested decision with clear reasoning
- Lists 2-3 author clarification requests
- Is written in the style of IEEE/ACM/NeurIPS meta-reviews

Start with: '# Meta-Review Draft (AI-generated — must be edited by AC)'
End with: '---\n*Draft generated by ResearchOS AI. All content requires human verification.*'"""

    result = _call_claude(system,
        f"Paper context:\n{paper_context}\n\nReviews:\n{reviews_text}",
        max_tokens=1200)
    if result:
        return result
    # Fallback
    from app.services.reviewer_fatigue import draft_meta_review
    return draft_meta_review(reviews, paper)


# ── Cost tracking ─────────────────────────────────────────────────────────

def estimate_cost(paper_chars: int, review_count: int) -> dict[str, Any]:
    """Rough cost estimate for an AI analysis run."""
    # Claude Sonnet pricing (approx): $3/M input, $15/M output
    input_tokens  = min(paper_chars, MAX_PAPER_CHARS) // 4 + review_count * 300
    output_tokens = MAX_TOKENS * 3   # 3 AI calls
    input_cost    = (input_tokens  / 1_000_000) * 3.00
    output_cost   = (output_tokens / 1_000_000) * 15.00
    total         = input_cost + output_cost
    return {
        "estimated_input_tokens":  input_tokens,
        "estimated_output_tokens": output_tokens,
        "estimated_cost_usd":      round(total, 4),
        "model":                   CLAUDE_MODEL,
        "note": "Estimate only. Actual cost depends on paper length and response size.",
    }


# ── Main pipeline ─────────────────────────────────────────────────────────

def run_ai_review_copilot(
    document_text: str,
    reviews: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Full AI-powered Review Copilot pipeline.

    Calls Claude for: claim analysis, reproducibility audit,
    reviewer synthesis, and meta-review draft.
    Falls back gracefully to heuristic if API unavailable.
    """
    if not document_text or len(document_text.strip()) < 30:
        raise ValueError("document_text must be at least 30 characters.")

    ai_available = bool(_api_key() and not _api_key().startswith("sk-ant-demo"))
    paper = parse_paper(document_text)

    t0 = time.time()

    # Run AI modules (with heuristic fallback inside each)
    claim_audit        = ai_analyze_claims(paper)
    repro_audit        = ai_audit_reproducibility(paper)
    meta_review        = ai_synthesize_reviews(reviews) if reviews else {
        "agreement_points": [], "disagreement_points": [],
        "missing_discussion_points": [],
        "balanced_meta_review": "No reviews provided.",
        "author_clarification_questions": [],
        "ai_powered": ai_available,
        "human_verification_required": True,
    }
    meta_draft = ai_generate_meta_review(reviews, paper) if reviews else ""

    # Always run heuristic citation audit (fast, no API cost)
    citation_audit = audit_citations(paper)

    # Build knowledge graph from heuristic engine
    from app.services.graph_engine import extract_graph
    kg = extract_graph(paper.get("title", ""), document_text, "paper")

    elapsed = round(time.time() - t0, 2)
    cost    = estimate_cost(len(document_text), len(reviews))

    # Build exports
    ac_report = _build_ac_report(paper, claim_audit, repro_audit, meta_review, cost)
    exports = {
        "review_analysis.md":   ac_report,
        "review_analysis.json": json.dumps({
            "paper": {k: v for k, v in paper.items() if k != "raw_text"},
            "claim_audit":    claim_audit,
            "repro_audit":    repro_audit,
            "meta_review":    meta_review,
            "citation_audit": citation_audit,
        }, indent=2, default=str),
        "review_summary.md": (
            f"# {paper.get('title','Paper')}\n\n"
            f"**AI Mode:** {'✅ Claude' if ai_available else '⚠️ Heuristic fallback'}\n\n"
            + (meta_draft or "Meta-review not available.")
        ),
        "meta_review_draft.md": meta_draft,
    }

    return {
        "paper":               {k: v for k, v in paper.items() if k != "raw_text"},
        "claim_audit":         claim_audit,
        "reproducibility_audit": repro_audit,
        "citation_audit":      citation_audit,
        "meta_review":         meta_review,
        "meta_review_draft":   meta_draft,
        "reviewer_analysis":   meta_review,   # keep compat with heuristic schema
        "knowledge_graph":     kg,
        "ai_powered":          ai_available,
        "ai_mode":             "claude" if ai_available else "heuristic_fallback",
        "model":               CLAUDE_MODEL if ai_available else "heuristic",
        "elapsed_seconds":     elapsed,
        "cost_estimate":       cost,
        "ethics":              ETHICS_WARNINGS + [
            "AI outputs require human verification — Claude can hallucinate.",
            "Do not send confidential submissions to external APIs without consent.",
        ],
        "exports": exports,
        "human_verification_required": True,
    }


def _build_ac_report(
    paper: dict[str, Any],
    claim_audit: dict[str, Any],
    repro_audit: dict[str, Any],
    meta_review: dict[str, Any],
    cost: dict[str, Any],
) -> str:
    from datetime import date
    ai = claim_audit.get("ai_powered", False)
    findings = claim_audit.get("findings", [])
    high = sum(1 for f in findings if f.get("severity") == "high")
    med  = sum(1 for f in findings if f.get("severity") == "medium")

    repro_items = [(k, v) for k, v in repro_audit.items() if isinstance(v, bool)]
    repro_pass  = sum(1 for _, v in repro_items if v)

    return f"""# AI Review Copilot — AC Report
**Generated:** {date.today().isoformat()}  
**Mode:** {'✅ Claude AI (' + cost['model'] + ')' if ai else '⚠️ Heuristic fallback (Claude unavailable)'}  
**Cost estimate:** ~${cost['estimated_cost_usd']} USD

---

## Paper
**Title:** {paper.get('title', 'Unknown')}

{paper.get('abstract', '')[:400]}

---

## Claim Analysis
- High-severity findings: **{high}**
- Medium-severity findings: **{med}**
- Overall quality: **{claim_audit.get('overall_claim_quality', 'N/A')}**

{chr(10).join('- ' + f.get('title','') for f in findings[:5])}

---

## Reproducibility
**Score:** {repro_pass}/{len(repro_items)} items met

{chr(10).join(('✅' if v else '❌') + ' ' + k.replace('_',' ') for k, v in repro_items)}

---

## Reviewer Consensus (AI synthesis)
{meta_review.get('balanced_meta_review', 'Not available.')}

### Agreements
{chr(10).join('- ' + p.get('title','') for p in meta_review.get('agreement_points',[])[:4]) or '- None identified.'}

### Disagreements
{chr(10).join('- ' + p.get('title','') for p in meta_review.get('disagreement_points',[])[:4]) or '- None identified.'}

---

## Ethics
- All AI outputs require human verification.
- Do not use this report as the sole basis for editorial decisions.
- Reviewer identities must remain confidential.

---
*Generated by ResearchOS AI Review Copilot. Human verification required for all findings.*
"""
