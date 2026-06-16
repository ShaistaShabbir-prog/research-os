"""Phase 2: Claim Verification Engine.

Heuristic-first pipeline — no LLM dependency.
Extracts claims, finds supporting evidence, scores support,
and flags unsupported claims for human review.
"""
from __future__ import annotations

import re
from typing import Any

# ── Patterns ──────────────────────────────────────────────────────────────
CLAIM_RE = re.compile(
    r"""(?x)
    (?:
        [A-Z][^.!?]{20,200}       # sentence starting with capital
        (?:
            achieves?|outperforms?|improves?|reduces?|increases?|
            demonstrates?|shows?|proves?|establishes?|confirms?|
            yields?|obtains?|reaches?|surpasses?|exceeds?
        )
        [^.!?]{0,150}
    )
    [.!?]
    """,
    re.VERBOSE,
)

EVIDENCE_RE = re.compile(
    r"""(?x)
    (?:
        [Tt]able\s+\d+|[Ff]igure\s+\d+|[Ff]ig\.\s*\d+|
        \d+\.?\d*\s*%|\d+\.?\d*\s*F1|\d+\.?\d*\s*accuracy|
        p\s*[<>=]\s*[\d.]+|ablation|experiment|baseline|
        \d+\s*(?:ms|μs|seconds?|epoch|samples?|subjects?)
    )
    """,
    re.VERBOSE,
)

OVERCLAIM_RE = re.compile(
    r"\b(first|only|novel|outperforms all|state-of-the-art|best|"
    r"superior|guarantee|always|never|solves|perfect)\b",
    re.IGNORECASE,
)

SECTION_RE = re.compile(r"^#{1,3}\s+(.+)$", re.MULTILINE)


def _find_section(text: str, char_pos: int) -> str:
    """Return section heading active at char_pos."""
    current = "Body"
    for m in SECTION_RE.finditer(text):
        if m.start() <= char_pos:
            current = m.group(1).strip()
    return current


# ── Public API ────────────────────────────────────────────────────────────

def extract_claims(paper_text: str) -> list[dict[str, Any]]:
    """Extract claim sentences from paper text with location metadata."""
    claims: list[dict[str, Any]] = []
    sentences = re.split(r"(?<=[.!?])\s+", paper_text)
    char_offset = 0

    for sent in sentences:
        sent_stripped = sent.strip()
        if len(sent_stripped) < 30:
            char_offset += len(sent) + 1
            continue

        has_claim_verb = CLAIM_RE.search(sent_stripped)
        has_overclaim  = OVERCLAIM_RE.search(sent_stripped)

        if has_claim_verb or has_overclaim:
            section = _find_section(paper_text, char_offset)
            claims.append({
                "claim_text": sent_stripped[:400],
                "start_char": char_offset,
                "end_char": char_offset + len(sent_stripped),
                "section": section,
                "has_overclaim_language": bool(has_overclaim),
                "claim_type": "quantitative" if re.search(r"\d+\.?\d*\s*%", sent_stripped)
                              else "comparative" if re.search(r"outperform|surpass|exceed|better than", sent_stripped, re.I)
                              else "existence",
                "human_verification_required": True,
            })

        char_offset += len(sent) + 1

    return claims


def extract_evidence(paper_text: str, claim: dict[str, Any]) -> list[dict[str, Any]]:
    """Find evidence spans in the paper that support a given claim."""
    evidence: list[dict[str, Any]] = []
    for m in EVIDENCE_RE.finditer(paper_text):
        surrounding = paper_text[max(0, m.start() - 120): m.end() + 120]
        evidence.append({
            "evidence_text": surrounding.strip()[:300],
            "start_char": m.start(),
            "end_char": m.end(),
            "evidence_type": _classify_evidence(m.group()),
            "section": _find_section(paper_text, m.start()),
        })
    # Deduplicate by section
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for ev in evidence:
        key = ev["section"] + ev["evidence_text"][:40]
        if key not in seen:
            seen.add(key)
            deduped.append(ev)
    return deduped[:6]


def _classify_evidence(span: str) -> str:
    if re.match(r"\d+\.?\d*\s*%|F1|accuracy", span, re.I):
        return "quantitative_result"
    if re.match(r"[Tt]able|[Ff]ig", span):
        return "figure_table"
    if re.match(r"p\s*[<>=]", span):
        return "statistical"
    return "empirical"


def score_support(claim: dict[str, Any], evidence_list: list[dict[str, Any]]) -> float:
    """Score 0.0–1.0: how well the evidence list supports the claim."""
    if not evidence_list:
        return 0.0

    score = 0.0
    claim_text = claim.get("claim_text", "").lower()

    # Quantitative claim needs quantitative evidence
    if claim.get("claim_type") == "quantitative":
        quant_ev = [e for e in evidence_list if e["evidence_type"] == "quantitative_result"]
        score += 0.4 if quant_ev else 0.1
    else:
        score += 0.25

    # Overclaim penalty
    if claim.get("has_overclaim_language"):
        score = max(0.0, score - 0.2)

    # Evidence count bonus
    score += min(0.3, len(evidence_list) * 0.08)

    # Figure/table bonus
    if any(e["evidence_type"] == "figure_table" for e in evidence_list):
        score += 0.15

    # Statistical bonus
    if any(e["evidence_type"] == "statistical" for e in evidence_list):
        score += 0.15

    return round(min(1.0, score), 3)


def detect_unsupported_claims(paper_text: str) -> list[dict[str, Any]]:
    """Return claims whose support score falls below threshold."""
    claims = extract_claims(paper_text)
    unsupported: list[dict[str, Any]] = []

    for claim in claims:
        evidence = extract_evidence(paper_text, claim)
        support  = score_support(claim, evidence)
        if support < 0.45:
            unsupported.append({
                **claim,
                "support_score": support,
                "evidence_count": len(evidence),
                "suggested_action": (
                    "Add quantitative result (table/figure) supporting this claim."
                    if claim["claim_type"] == "quantitative"
                    else "Qualify or add citation supporting this claim."
                ),
            })

    return sorted(unsupported, key=lambda x: x["support_score"])


def run_claim_verification(document_text: str) -> dict[str, Any]:
    """Full claim verification pipeline."""
    if not document_text or len(document_text.strip()) < 30:
        raise ValueError("document_text must be at least 30 characters.")

    claims    = extract_claims(document_text)
    unsupported = detect_unsupported_claims(document_text)

    all_scored: list[dict[str, Any]] = []
    for claim in claims:
        evidence = extract_evidence(document_text, claim)
        support  = score_support(claim, evidence)
        all_scored.append({
            **claim,
            "support_score": support,
            "evidence": evidence[:3],
            "verdict": "supported" if support >= 0.45 else "unsupported",
        })

    supported_count   = sum(1 for c in all_scored if c["verdict"] == "supported")
    unsupported_count = len(all_scored) - supported_count

    return {
        "claim_count":       len(claims),
        "supported_count":   supported_count,
        "unsupported_count": unsupported_count,
        "support_rate":      round(supported_count / max(1, len(claims)), 3),
        "claims":            all_scored,
        "unsupported_claims": unsupported,
        "ethics": [
            "Claim verification is heuristic. Human judgment required for all findings.",
            "A claim marked 'unsupported' may still be valid — verify manually.",
        ],
        "human_verification_required": True,
    }
