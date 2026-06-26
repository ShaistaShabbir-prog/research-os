"""
Issue #46: Reviewer recommendation from Semantic Scholar.
"""
import logging
import os
from typing import Any

log = logging.getLogger(__name__)


def suggest_reviewers(title: str, abstract: str, keywords: list[str] | None = None,
                       top_k: int = 10) -> dict[str, Any]:
    """
    Suggest reviewers by finding authors of similar recent papers.
    Uses Semantic Scholar API (free, no auth required for basic use).
    """
    try:
        import requests as req

        query = f"{title} {' '.join(keywords or [])} {abstract[:150]}"
        url   = "https://api.semanticscholar.org/graph/v1/paper/search"
        r = req.get(url, params={
            "query": query,
            "fields": "title,year,authors,citationCount",
            "limit": 20,
        }, timeout=15)
        r.raise_for_status()
        papers = r.json().get("data", [])
    except Exception as e:
        return {"error": str(e), "reviewers": []}

    # Collect author frequencies
    from collections import defaultdict
    author_counts: dict[str, dict] = defaultdict(lambda: {"count": 0, "papers": []})

    for paper in papers:
        if paper.get("year", 0) < 2020:
            continue  # only recent authors
        for author in paper.get("authors", []):
            name = author.get("name", "")
            aid  = author.get("authorId", "")
            if not name: continue
            key = aid or name
            author_counts[key]["count"]  += 1
            author_counts[key]["name"]    = name
            author_counts[key]["author_id"] = aid
            author_counts[key]["papers"].append(paper.get("title", "")[:60])

    # Sort by paper count
    reviewers = sorted(author_counts.values(), key=lambda x: x["count"], reverse=True)

    return {
        "query_title":    title,
        "suggested_reviewers": reviewers[:top_k],
        "total_candidates":    len(reviewers),
        "note": "Based on Semantic Scholar API. Always check for conflicts of interest.",
        "disclaimer": "This is a suggestion tool only. Human area chairs must make final assignments.",
    }
