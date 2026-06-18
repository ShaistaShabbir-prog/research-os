"""Issue #16: Reproducibility Badge System.

Generates embeddable SVG badges for research papers:
  - Reproducibility score badge (X/12 items)
  - Claim audit badge (N claims verified)
  - Overall quality badge

Badges are served as SVG via GET /api/badge/{paper_hash}
and can be embedded in README, arXiv, or paper websites.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import time
from dataclasses import dataclass, field
from typing import Any

from app.services.review_copilot import audit_reproducibility, parse_paper


# ── Badge registry (in-memory, production would use DB) ───────────────────
_BADGE_REGISTRY: dict[str, dict[str, Any]] = {}


@dataclass
class BadgeData:
    paper_hash:           str
    title:                str
    reproducibility_score: int          # 0-100
    items_passed:         int
    items_total:          int
    claim_count:          int
    verified_claims:      int
    overall_grade:        str           # A/B/C/D/F
    created_at:           float = field(default_factory=time.time)
    verified_by_ac:       bool  = False
    custom_label:         str   = ""


# ── Grade calculation ─────────────────────────────────────────────────────

def _grade(score: int) -> str:
    if score >= 90: return "A"
    if score >= 75: return "B"
    if score >= 60: return "C"
    if score >= 45: return "D"
    return "F"


def _grade_color(grade: str) -> str:
    return {"A":"#22c55e","B":"#84cc16","C":"#f59e0b","D":"#f97316","F":"#ef4444"}.get(grade,"#64748b")


def _score_color(score: int) -> str:
    if score >= 75: return "#22c55e"
    if score >= 50: return "#f59e0b"
    return "#ef4444"


# ── Hash ──────────────────────────────────────────────────────────────────

def paper_hash(title: str, abstract: str = "") -> str:
    """Stable 12-char hash for a paper (title + abstract prefix)."""
    raw = (title.lower().strip() + abstract[:200]).encode()
    return hashlib.sha256(raw).hexdigest()[:12]


# ── Badge registration ────────────────────────────────────────────────────

def register_badge(document_text: str) -> dict[str, Any]:
    """
    Analyse a paper and register it in the badge registry.
    Returns badge data + embed code.
    """
    paper  = parse_paper(document_text)
    repro  = audit_reproducibility(paper)

    items       = [(k, v) for k, v in repro.items() if isinstance(v, bool)]
    passed      = sum(1 for _, v in items if v)
    total       = len(items)
    score       = round((passed / max(1, total)) * 100)
    grade       = _grade(score)

    from app.services.claim_verification import extract_claims, score_support, extract_evidence
    claims        = extract_claims(document_text)
    verified      = sum(
        1 for c in claims
        if score_support(c, extract_evidence(document_text, c)) >= 0.45
    )

    h = paper_hash(paper["title"], paper.get("abstract",""))

    badge = BadgeData(
        paper_hash            = h,
        title                 = paper["title"][:120],
        reproducibility_score = score,
        items_passed          = passed,
        items_total           = total,
        claim_count           = len(claims),
        verified_claims       = verified,
        overall_grade         = grade,
    )

    _BADGE_REGISTRY[h] = {
        "paper_hash":             h,
        "title":                  badge.title,
        "reproducibility_score":  score,
        "items_passed":           passed,
        "items_total":            total,
        "claim_count":            len(claims),
        "verified_claims":        verified,
        "overall_grade":          grade,
        "grade_color":            _grade_color(grade),
        "score_color":            _score_color(score),
        "created_at":             badge.created_at,
        "verified_by_ac":         False,
        "checklist":              {k: v for k, v in items},
        "embed_svg_url":          f"/api/badge/{h}.svg",
        "embed_markdown":         f"![Reproducibility](https://researchos.app/api/badge/{h}.svg)",
        "embed_html":             f'<img src="https://researchos.app/api/badge/{h}.svg" alt="Reproducibility Badge">',
        "human_verification_required": True,
    }

    return _BADGE_REGISTRY[h]


def get_badge(paper_hash_id: str) -> dict[str, Any] | None:
    """Retrieve badge data by hash."""
    return _BADGE_REGISTRY.get(paper_hash_id)


def list_badges() -> list[dict[str, Any]]:
    """List all registered badges (public registry)."""
    return sorted(_BADGE_REGISTRY.values(), key=lambda b: b["created_at"], reverse=True)


# ── SVG generation ────────────────────────────────────────────────────────

def generate_badge_svg(
    paper_hash_id: str,
    style: str = "flat",
) -> str:
    """
    Generate an SVG badge for a registered paper.
    style: 'flat' | 'flat-square' | 'for-the-badge'
    """
    data = get_badge(paper_hash_id)
    if not data:
        return _svg_not_found()

    score = data["reproducibility_score"]
    grade = data["overall_grade"]
    color = _grade_color(grade)
    label = "ResearchOS"
    value = f"{data['items_passed']}/{data['items_total']} · Grade {grade}"

    if style == "for-the-badge":
        return _svg_for_the_badge(label, value, color, score)
    if style == "flat-square":
        return _svg_flat(label, value, color, score, radius=0)
    return _svg_flat(label, value, color, score, radius=4)


def generate_score_svg(score: int, label: str = "Reproducibility") -> str:
    """Quick SVG from raw score (no registry lookup)."""
    grade = _grade(score)
    color = _grade_color(grade)
    return _svg_flat(label, f"{score}% · {grade}", color, score)


def _svg_flat(label: str, value: str, color: str, score: int, radius: int = 4) -> str:
    """Shields.io-style flat badge SVG."""
    esc_label = html.escape(label)
    esc_value = html.escape(value)
    lw  = len(label) * 6 + 10
    vw  = len(value) * 6 + 10
    w   = lw + vw
    h   = 20
    r   = radius

    # Score ring arc
    ring_r    = 7
    ring_circ = 2 * 3.14159 * ring_r
    ring_dash = (score / 100) * ring_circ

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w + 28}" height="{h}" role="img" aria-label="{esc_label}: {esc_value}">
  <title>{esc_label}: {esc_value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="{w + 28}" height="{h}" rx="{r}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="{lw}" height="{h}" fill="#555"/>
    <rect x="{lw}" width="{vw + 28}" height="{h}" fill="{color}"/>
    <rect width="{w + 28}" height="{h}" fill="url(#s)"/>
  </g>
  <!-- Score ring -->
  <circle cx="{w + 14}" cy="{h // 2}" r="{ring_r}"
    fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <circle cx="{w + 14}" cy="{h // 2}" r="{ring_r}"
    fill="none" stroke="white" stroke-width="1.5"
    stroke-dasharray="{ring_dash:.1f} {ring_circ:.1f}"
    stroke-linecap="round"
    transform="rotate(-90 {w + 14} {h // 2})"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{lw // 2}" y="15" fill="#010101" fill-opacity=".3">{esc_label}</text>
    <text x="{lw // 2}" y="14">{esc_label}</text>
    <text x="{lw + vw // 2}" y="15" fill="#010101" fill-opacity=".3">{esc_value}</text>
    <text x="{lw + vw // 2}" y="14">{esc_value}</text>
  </g>
</svg>"""


def _svg_for_the_badge(label: str, value: str, color: str, score: int) -> str:
    """Larger 'for-the-badge' style."""
    esc_label = html.escape(label.upper())
    esc_value = html.escape(value.upper())
    lw = len(label) * 8 + 20
    vw = len(value) * 8 + 20
    w  = lw + vw
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="28" role="img">
  <title>{esc_label}: {esc_value}</title>
  <g>
    <rect width="{lw}" height="28" fill="#555"/>
    <rect x="{lw}" width="{vw}" height="28" fill="{color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif"
     font-size="11" font-weight="bold" letter-spacing="1">
    <text x="{lw // 2}" y="19">{esc_label}</text>
    <text x="{lw + vw // 2}" y="19">{esc_value}</text>
  </g>
</svg>"""


def _svg_not_found() -> str:
    return _svg_flat("ResearchOS", "badge not found", "#64748b", 0)


# ── Markdown report ───────────────────────────────────────────────────────

def badge_report(paper_hash_id: str) -> str:
    """Generate a Markdown reproducibility report for a paper."""
    data = get_badge(paper_hash_id)
    if not data:
        return "Badge not found."

    checklist = data.get("checklist", {})
    lines = [
        f"# Reproducibility Report — {data['title'][:80]}",
        f"\n**Hash:** `{paper_hash_id}`  ",
        f"**Score:** {data['reproducibility_score']}% ({data['items_passed']}/{data['items_total']} items)  ",
        f"**Grade:** {data['overall_grade']}  ",
        f"**Claims verified:** {data['verified_claims']}/{data['claim_count']}  ",
        "\n## Checklist\n",
    ] + [
        f"- {'✅' if v else '❌'} {k.replace('_',' ')}"
        for k, v in checklist.items()
    ] + [
        "\n## Embed\n",
        f"```markdown\n{data['embed_markdown']}\n```",
        "\n---",
        "*Generated by ResearchOS. Human verification required.*",
    ]
    return "\n".join(lines)
