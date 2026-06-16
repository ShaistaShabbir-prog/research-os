"""Phase 3: Reviewer Fatigue Assistant.

Solves the professor/AC ARR problem:
- 3 reviews, no time, need to make a decision.
- Summarises each review, builds disagreement matrix,
  generates AC briefing, drafts meta-review.
All heuristic-first, no LLM dependency.
"""
from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any

# ── Dimensions tracked across reviews ─────────────────────────────────────
DIMENSIONS = [
    "reproducibility",
    "novelty",
    "baselines",
    "writing_clarity",
    "experimental_design",
    "limitations",
    "ethical_concerns",
    "related_work",
]

DIMENSION_KEYWORDS: dict[str, list[str]] = {
    "reproducibility":      ["reproducib", "seed", "code", "dataset", "replicat"],
    "novelty":              ["novel", "original", "first", "contribution", "innovation"],
    "baselines":            ["baseline", "comparison", "benchmark", "competing", "sota"],
    "writing_clarity":      ["writing", "clarity", "unclear", "confus", "well-written"],
    "experimental_design":  ["experiment", "ablation", "setup", "design", "evaluation"],
    "limitations":          ["limitation", "weakness", "shortcoming", "future work"],
    "ethical_concerns":     ["ethic", "bias", "fairness", "harm", "responsible"],
    "related_work":         ["related work", "literature", "prior work", "citation"],
}

POSITIVE_WORDS = {"strong", "clear", "excellent", "solid", "good", "impressive",
                  "well", "thorough", "compelling", "interesting", "important"}
NEGATIVE_WORDS = {"missing", "unclear", "weak", "insufficient", "limited", "lacks",
                  "poor", "problematic", "flawed", "unconvincing", "vague"}

RECOMMENDATION_ORDER = {
    "accept": 4, "strong accept": 5,
    "weak accept": 3, "borderline": 2,
    "weak reject": 1, "reject": 0, "strong reject": -1,
}


def _sentiment(text: str) -> str:
    words = set(text.lower().split())
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    if pos > neg: return "positive"
    if neg > pos: return "negative"
    return "mixed"


def _dim_score(text: str, keywords: list[str]) -> str:
    """Return 'raised', 'praised', or 'not_mentioned' for a dimension."""
    text_l = text.lower()
    mentioned = any(kw in text_l for kw in keywords)
    if not mentioned:
        return "not_mentioned"
    # Check surrounding sentiment
    for kw in keywords:
        idx = text_l.find(kw)
        if idx == -1:
            continue
        context = text_l[max(0, idx-60):idx+80]
        if any(neg in context for neg in NEGATIVE_WORDS):
            return "raised"   # raised as concern
        if any(pos in context for pos in POSITIVE_WORDS):
            return "praised"
    return "raised"


# ── Public API ────────────────────────────────────────────────────────────

def summarize_reviews(reviews: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Produce a concise summary card per reviewer."""
    summaries: list[dict[str, Any]] = []
    for rev in reviews:
        rid  = rev.get("reviewer_id", "R?")
        rec  = rev.get("recommendation", "").lower().strip()
        summary_text = rev.get("summary", "")
        strengths    = rev.get("strengths", [])
        weaknesses   = rev.get("weaknesses", [])

        full_text = " ".join([summary_text] + strengths + weaknesses)
        sentiment = _sentiment(full_text)
        rec_score = RECOMMENDATION_ORDER.get(rec, 2)

        # Build dimension coverage
        dim_coverage: dict[str, str] = {}
        for dim, kws in DIMENSION_KEYWORDS.items():
            dim_coverage[dim] = _dim_score(full_text, kws)

        summaries.append({
            "reviewer_id":      rid,
            "recommendation":   rec or "not stated",
            "recommendation_score": rec_score,
            "sentiment":        sentiment,
            "top_strength":     strengths[0] if strengths else "not stated",
            "top_weakness":     weaknesses[0] if weaknesses else "not stated",
            "strength_count":   len(strengths),
            "weakness_count":   len(weaknesses),
            "dimension_coverage": dim_coverage,
            "review_length_words": len(full_text.split()),
            "one_line": f"{rid} ({rec or '?'}): {summary_text[:120]}",
        })

    return summaries


def generate_disagreement_matrix(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    """Build a dimension × reviewer matrix highlighting disagreements."""
    summaries = summarize_reviews(reviews)
    matrix: dict[str, dict[str, str]] = {}

    for dim in DIMENSIONS:
        row: dict[str, str] = {}
        for s in summaries:
            row[s["reviewer_id"]] = s["dimension_coverage"].get(dim, "not_mentioned")
        matrix[dim] = row

    # Find disagreements: same dimension, different stances
    disagreements: list[dict[str, Any]] = []
    for dim, row in matrix.items():
        stances = list(row.values())
        if len(set(stances)) > 1 and "not_mentioned" not in set(stances):
            disagreements.append({
                "dimension": dim,
                "stances":   row,
                "severity":  "high" if {"raised", "praised"} == set(s for s in stances if s != "not_mentioned") else "medium",
            })

    # Recommendation spread
    rec_scores = [RECOMMENDATION_ORDER.get(r.get("recommendation", "").lower(), 2)
                  for r in reviews]
    rec_spread = max(rec_scores) - min(rec_scores) if rec_scores else 0

    return {
        "matrix":           matrix,
        "disagreements":    disagreements,
        "disagreement_count": len(disagreements),
        "recommendation_spread": rec_spread,
        "recommendation_spread_label": (
            "high divergence" if rec_spread >= 3
            else "moderate divergence" if rec_spread >= 2
            else "low divergence"
        ),
        "reviewer_ids": [s["reviewer_id"] for s in summaries],
        "dimensions":   DIMENSIONS,
    }


def generate_ac_briefing(
    reviews: list[dict[str, Any]],
    paper_summary: str = "",
) -> dict[str, Any]:
    """Generate a concise Area Chair briefing."""
    summaries = summarize_reviews(reviews)
    matrix    = generate_disagreement_matrix(reviews)

    # Consensus: items mentioned by >= 60% of reviewers
    def consensus_items(field: str) -> list[str]:
        counter: Counter[str] = Counter()
        for rev in reviews:
            for item in rev.get(field, []):
                counter[item.lower().strip()] += 1
        threshold = max(2, len(reviews) * 0.6)
        return [item for item, cnt in counter.most_common(10) if cnt >= threshold]

    consensus_strengths  = consensus_items("strengths")
    consensus_weaknesses = consensus_items("weaknesses")

    # Recommendation distribution
    rec_dist: dict[str, int] = defaultdict(int)
    for rev in reviews:
        rec = rev.get("recommendation", "not stated").lower().strip()
        rec_dist[rec] += 1

    rec_scores = [RECOMMENDATION_ORDER.get(r.get("recommendation", "").lower(), 2)
                  for r in reviews]
    avg_score  = sum(rec_scores) / max(1, len(rec_scores))

    suggested_decision = (
        "Accept" if avg_score >= 3.5
        else "Borderline — author response recommended" if avg_score >= 2.0
        else "Reject"
    )

    return {
        "paper_summary":       paper_summary[:400] if paper_summary else "Not provided.",
        "reviewer_count":      len(reviews),
        "recommendation_distribution": dict(rec_dist),
        "average_rec_score":   round(avg_score, 2),
        "suggested_decision":  suggested_decision,
        "consensus_strengths": consensus_strengths,
        "consensus_weaknesses": consensus_weaknesses,
        "key_disagreements":   matrix["disagreements"][:4],
        "reviewers":           [s["one_line"] for s in summaries],
        "action_items": [
            f"Resolve disagreement on: {d['dimension']}" for d in matrix["disagreements"][:3]
        ],
        "human_verification_required": True,
    }


def draft_meta_review(
    reviews: list[dict[str, Any]],
    paper: dict[str, Any] | None = None,
) -> str:
    """Draft a structured meta-review text for the AC to edit."""
    briefing  = generate_ac_briefing(reviews, paper.get("abstract", "") if paper else "")
    summaries = summarize_reviews(reviews)

    rec_lines = "\n".join(f"- {s['one_line']}" for s in summaries)
    strength_lines = (
        "\n".join(f"- {s}" for s in briefing["consensus_strengths"])
        if briefing["consensus_strengths"] else "- No consensus strengths identified."
    )
    weakness_lines = (
        "\n".join(f"- {s}" for s in briefing["consensus_weaknesses"])
        if briefing["consensus_weaknesses"] else "- No consensus weaknesses identified."
    )
    disagree_lines = (
        "\n".join(
            f"- **{d['dimension']}**: reviewers disagree ({', '.join(f'{r}: {s}' for r, s in d['stances'].items())})"
            for d in briefing["key_disagreements"]
        )
        if briefing["key_disagreements"] else "- No major disagreements identified."
    )

    return f"""# Meta-Review Draft

> **⚠ DRAFT — generated by Reviewer Fatigue Assistant. Must be edited and verified by the Area Chair before submission.**

## Summary of Reviews

{rec_lines}

## Consensus Strengths

{strength_lines}

## Consensus Weaknesses

{weakness_lines}

## Points of Disagreement

{disagree_lines}

## Suggested Decision: {briefing['suggested_decision']}

This suggestion is based on an average recommendation score of {briefing['average_rec_score']:.1f}/5
across {briefing['reviewer_count']} reviewers. **The Area Chair must verify this independently.**

## Author Response Required?

{'Yes — reviewers disagree on ' + str(len(briefing['key_disagreements'])) + ' dimension(s).' if briefing['key_disagreements'] else 'Not mandatory, but recommended.'}

---
*Generated by ResearchOS Reviewer Fatigue Assistant. All content requires human verification.*
"""


def run_reviewer_fatigue(
    document_text: str,
    reviews: list[dict[str, Any]],
) -> dict[str, Any]:
    """Full reviewer fatigue pipeline."""
    if not reviews:
        raise ValueError("At least one review is required.")

    paper_summary = document_text[:500] if document_text else ""

    summaries  = summarize_reviews(reviews)
    matrix     = generate_disagreement_matrix(reviews)
    briefing   = generate_ac_briefing(reviews, paper_summary)
    meta_draft = draft_meta_review(reviews, {"abstract": paper_summary})

    return {
        "reviewer_summaries":    summaries,
        "disagreement_matrix":   matrix,
        "ac_briefing":           briefing,
        "meta_review_draft":     meta_draft,
        "exports": {
            "meta_review_draft.md": meta_draft,
            "ac_briefing.json":     __import__("json").dumps(briefing, indent=2),
        },
        "ethics": [
            "This tool supports AC judgment and must not replace it.",
            "The suggested decision is heuristic — always verify independently.",
            "Do not share reviewer identities or confidential content externally.",
        ],
        "human_verification_required": True,
    }
