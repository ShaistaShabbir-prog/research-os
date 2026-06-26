"""
Issue #45: Paper similarity detection using Semantic Scholar API.
"""
import logging
import os
import math
from typing import Any

log = logging.getLogger(__name__)


def check_similarity(title: str, abstract: str,
                     top_k: int = 5) -> dict[str, Any]:
    """
    Check paper similarity against Semantic Scholar corpus.
    Returns top-k similar papers with similarity scores.
    """
    try:
        import requests as req

        query   = f"{title} {abstract[:200]}"
        url     = "https://api.semanticscholar.org/graph/v1/paper/search"
        params  = {
            "query": query,
            "fields": "title,abstract,year,authors,externalIds",
            "limit": top_k * 2,
        }
        headers = {}
        if os.getenv("SEMANTIC_SCHOLAR_API_KEY"):
            headers["x-api-key"] = os.getenv("SEMANTIC_SCHOLAR_API_KEY")

        r = req.get(url, params=params, headers=headers, timeout=15)
        r.raise_for_status()
        papers = r.json().get("data", [])

    except ImportError:
        return {"error": "requests not installed"}
    except Exception as e:
        log.warning("Semantic Scholar API failed: %s", e)
        return {"error": str(e), "papers": []}

    results = []
    for p in papers[:top_k]:
        sim = _simple_similarity(
            f"{title} {abstract}",
            f"{p.get('title','')} {(p.get('abstract') or '')[:300]}"
        )
        results.append({
            "title":      p.get("title", ""),
            "year":       p.get("year"),
            "authors":    [a["name"] for a in p.get("authors", [])[:3]],
            "similarity": round(sim, 3),
            "flag":       sim > 0.85,
            "paper_id":   p.get("paperId", ""),
            "url": f"https://www.semanticscholar.org/paper/{p.get('paperId','')}"
                   if p.get("paperId") else None,
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    flagged = sum(1 for r in results if r["flag"])

    return {
        "query_title":   title,
        "results":       results,
        "flagged_count": flagged,
        "max_similarity": results[0]["similarity"] if results else 0,
        "warning": "High similarity detected — review carefully" if flagged else None,
    }


def _simple_similarity(text_a: str, text_b: str) -> float:
    """Jaccard word-overlap similarity (fallback when no embedding model)."""
    words_a = set(text_a.lower().split())
    words_b = set(text_b.lower().split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union        = words_a | words_b
    return len(intersection) / len(union)
