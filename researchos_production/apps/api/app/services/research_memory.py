"""Phase 4: Research Memory.

Compare Paper A, Paper B, Paper C automatically:
- Novelty overlap (concept/method deduplication)
- Citation overlap (shared references)
- Contribution overlap (what each paper claims to contribute)

All heuristic-first, no LLM dependency.
"""
from __future__ import annotations

import re
from itertools import combinations
from typing import Any

# ── Patterns ──────────────────────────────────────────────────────────────
CONTRIBUTION_RE = re.compile(
    r"""(?x)
    (?:
        we\s+(?:propose|present|introduce|develop|contribute|release|release|show|demonstrate)|
        this\s+(?:paper|work|study)\s+(?:proposes?|presents?|introduces?|develops?)|
        our\s+(?:main\s+)?contribution|
        the\s+(?:key|main|primary|novel)\s+contribution|
        we\s+are\s+the\s+first
    )
    [^.!?]{10,300}[.!?]
    """,
    re.IGNORECASE | re.VERBOSE,
)

CITATION_RE = re.compile(
    r"""(?x)
    (?:
        \[[\d,\s\-]+\]          |   # [1], [1,2], [1-3]
        \[\d+(?:,\s*\d+)*\]     |   # [1, 2]
        \((?:[A-Z][a-z]+(?:\s+et\s+al\.?)?,?\s*(?:19|20)\d{2})\)  # (Smith et al., 2023)
    )
    """,
    re.VERBOSE,
)

CONCEPT_RE = re.compile(
    r"\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\b"
)

SECTION_RE = re.compile(r"^#{1,3}\s+(.+)$", re.MULTILINE)

NOVELTY_SECTION_RE = re.compile(
    r"(?:introduction|contribution|abstract|related\s+work)",
    re.IGNORECASE,
)


def _extract_paper_title(text: str) -> str:
    """Best-effort title extraction from first non-blank line."""
    for line in text.splitlines():
        line = line.strip().lstrip("#").strip()
        if len(line) > 10:
            return line[:120]
    return "Untitled"


def extract_contributions(paper_text: str) -> list[dict[str, Any]]:
    """Extract explicit contribution statements from a paper."""
    contributions: list[dict[str, Any]] = []
    for m in CONTRIBUTION_RE.finditer(paper_text):
        text = m.group().strip()
        # Find active section
        section = "Body"
        for sm in SECTION_RE.finditer(paper_text):
            if sm.start() <= m.start():
                section = sm.group(1).strip()
        contributions.append({
            "text":       text[:300],
            "start_char": m.start(),
            "section":    section,
            "is_first_claim": bool(re.search(r"first", text, re.I)),
        })
    return contributions


def _extract_citations(text: str) -> set[str]:
    """Extract normalised citation strings."""
    return {m.group().strip() for m in CITATION_RE.finditer(text)}


def _extract_concepts(text: str) -> set[str]:
    """Extract capitalised multi-word concepts (methods, models, datasets)."""
    # Focus on introduction and abstract where key concepts appear
    intro_match = re.search(
        r"(?:introduction|abstract)(.*?)(?:#{1,3}\s+\w|$)",
        text, re.IGNORECASE | re.DOTALL
    )
    target = intro_match.group(1) if intro_match else text[:3000]

    concepts: set[str] = set()
    for m in CONCEPT_RE.finditer(target):
        concept = m.group(1)
        if len(concept) >= 4 and concept not in {
            "This", "The", "Our", "We", "In", "For", "By", "With", "On", "As"
        }:
            concepts.add(concept)
    return concepts


def _jaccard(a: set, b: set) -> float:
    """Jaccard similarity between two sets."""
    if not a and not b:
        return 0.0
    return round(len(a & b) / len(a | b), 3)


# ── Public API ────────────────────────────────────────────────────────────

def compare_novelty_overlap(papers: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Pairwise novelty-concept similarity matrix.
    papers: list of {"id": str, "text": str}
    """
    concept_sets: dict[str, set[str]] = {}
    for p in papers:
        concept_sets[p["id"]] = _extract_concepts(p["text"])

    pairs: list[dict[str, Any]] = []
    ids = [p["id"] for p in papers]
    for a, b in combinations(ids, 2):
        sim = _jaccard(concept_sets[a], concept_sets[b])
        shared = sorted(concept_sets[a] & concept_sets[b])[:10]
        pairs.append({
            "paper_a":         a,
            "paper_b":         b,
            "similarity":      sim,
            "shared_concepts": shared,
            "unique_to_a":     sorted(concept_sets[a] - concept_sets[b])[:8],
            "unique_to_b":     sorted(concept_sets[b] - concept_sets[a])[:8],
            "overlap_label":   (
                "high overlap" if sim >= 0.4
                else "moderate overlap" if sim >= 0.2
                else "low overlap"
            ),
        })

    return {
        "pairs":          pairs,
        "concept_sets":   {k: sorted(v)[:15] for k, v in concept_sets.items()},
        "most_similar":   max(pairs, key=lambda x: x["similarity"]) if pairs else None,
        "least_similar":  min(pairs, key=lambda x: x["similarity"]) if pairs else None,
    }


def compare_citation_overlap(papers: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Pairwise citation overlap matrix.
    papers: list of {"id": str, "text": str}
    """
    citation_sets: dict[str, set[str]] = {}
    for p in papers:
        citation_sets[p["id"]] = _extract_citations(p["text"])

    pairs: list[dict[str, Any]] = []
    ids = [p["id"] for p in papers]
    for a, b in combinations(ids, 2):
        sim = _jaccard(citation_sets[a], citation_sets[b])
        shared = sorted(citation_sets[a] & citation_sets[b])[:10]
        pairs.append({
            "paper_a":          a,
            "paper_b":          b,
            "similarity":       sim,
            "shared_citations": shared,
            "shared_count":     len(citation_sets[a] & citation_sets[b]),
            "unique_to_a":      len(citation_sets[a] - citation_sets[b]),
            "unique_to_b":      len(citation_sets[b] - citation_sets[a]),
            "overlap_label":    (
                "heavily overlapping literature" if sim >= 0.4
                else "related fields" if sim >= 0.15
                else "distinct literature"
            ),
        })

    # Shared across ALL papers
    if len(ids) >= 2:
        all_shared = citation_sets[ids[0]].copy()
        for pid in ids[1:]:
            all_shared &= citation_sets[pid]
    else:
        all_shared = set()

    return {
        "pairs":              pairs,
        "citation_counts":    {pid: len(cs) for pid, cs in citation_sets.items()},
        "shared_by_all":      sorted(all_shared)[:10],
        "shared_by_all_count": len(all_shared),
    }


def compare_contribution_overlap(papers: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Side-by-side contribution comparison.
    papers: list of {"id": str, "text": str}
    """
    contributions: dict[str, list[dict[str, Any]]] = {}
    for p in papers:
        contribs = extract_contributions(p["text"])
        contributions[p["id"]] = contribs

    # First-claims (papers claiming to be first)
    first_claims: dict[str, list[str]] = {
        pid: [c["text"][:200] for c in cs if c.get("is_first_claim")]
        for pid, cs in contributions.items()
    }

    # Build comparison table
    comparison: list[dict[str, Any]] = []
    for pid, cs in contributions.items():
        comparison.append({
            "paper_id":          pid,
            "contribution_count": len(cs),
            "has_first_claim":   bool(first_claims.get(pid)),
            "contributions":     [c["text"][:200] for c in cs[:5]],
        })

    # Detect potential overlaps (same first-claim)
    overlap_warnings: list[str] = []
    paper_ids = list(contributions.keys())
    for a, b in combinations(paper_ids, 2):
        a_texts = " ".join(c["text"].lower() for c in contributions[a])
        b_texts = " ".join(c["text"].lower() for c in contributions[b])
        # Check if key contribution nouns overlap
        a_nouns = set(re.findall(r"\b[a-z]{5,}\b", a_texts))
        b_nouns = set(re.findall(r"\b[a-z]{5,}\b", b_texts))
        overlap_ratio = _jaccard(a_nouns, b_nouns)
        if overlap_ratio >= 0.35:
            overlap_warnings.append(
                f"{a} and {b} may address similar contributions "
                f"(contribution language overlap: {overlap_ratio:.0%})."
            )

    return {
        "comparison":         comparison,
        "first_claims":       first_claims,
        "overlap_warnings":   overlap_warnings,
        "contribution_counts": {pid: len(cs) for pid, cs in contributions.items()},
    }


def run_research_memory(papers: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Full multi-paper comparison pipeline.
    papers: list of {"id": str, "text": str, "title"?: str}
    """
    if len(papers) < 2:
        raise ValueError("Research Memory requires at least 2 papers.")
    if len(papers) > 10:
        raise ValueError("Research Memory supports up to 10 papers.")

    # Ensure each paper has an id and title
    enriched: list[dict[str, Any]] = []
    for i, p in enumerate(papers):
        pid   = p.get("id") or f"Paper_{chr(65 + i)}"
        title = p.get("title") or _extract_paper_title(p["text"])
        enriched.append({"id": pid, "title": title, "text": p["text"]})

    novelty      = compare_novelty_overlap(enriched)
    citations    = compare_citation_overlap(enriched)
    contributions = compare_contribution_overlap(enriched)

    # Build summary table
    summary_rows: list[dict[str, Any]] = []
    for p in enriched:
        pid = p["id"]
        contrib_data = next(
            (c for c in contributions["comparison"] if c["paper_id"] == pid), {}
        )
        summary_rows.append({
            "id":                 pid,
            "title":              p["title"],
            "contribution_count": contrib_data.get("contribution_count", 0),
            "citation_count":     citations["citation_counts"].get(pid, 0),
            "concept_count":      len(novelty["concept_sets"].get(pid, [])),
            "has_first_claim":    contrib_data.get("has_first_claim", False),
        })

    import json
    return {
        "paper_count":         len(enriched),
        "papers":              [{"id": p["id"], "title": p["title"]} for p in enriched],
        "summary":             summary_rows,
        "novelty_overlap":     novelty,
        "citation_overlap":    citations,
        "contribution_overlap": contributions,
        "exports": {
            "research_memory.json": json.dumps({
                "papers":              summary_rows,
                "novelty_overlap":     novelty,
                "citation_overlap":    citations,
                "contribution_overlap": contributions,
            }, indent=2, default=str),
        },
        "ethics": [
            "Overlap analysis is heuristic. Verify all findings manually.",
            "Citation matching is syntactic — the same work may appear under different formats.",
            "Contribution overlap does not imply plagiarism — verify with domain expertise.",
        ],
        "human_verification_required": True,
    }
