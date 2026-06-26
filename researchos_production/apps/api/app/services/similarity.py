"""
Issue #45: Paper similarity detection via Semantic Scholar API.
"""
from __future__ import annotations
import logging, os
import httpx

log = logging.getLogger(__name__)
SS_API = "https://api.semanticscholar.org/graph/v1"


def find_similar_papers(title: str, abstract: str, limit: int = 5) -> list[dict]:
    """
    Find similar papers using Semantic Scholar search.
    Returns top-N papers with cosine similarity scores.
    """
    query = f"{title} {abstract[:200]}"
    try:
        r = httpx.get(f"{SS_API}/paper/search",
            params={"query": query, "limit": limit,
                    "fields": "title,abstract,authors,year,citationCount,externalIds"},
            timeout=10, headers={"User-Agent": "ResearchOS/1.0"})
        r.raise_for_status()
        papers = r.json().get("data", [])
        results = []
        for p in papers:
            sim = _simple_similarity(title, p.get("title",""))
            results.append({
                "title":        p.get("title",""),
                "authors":      [a.get("name","") for a in p.get("authors",[])[:3]],
                "year":         p.get("year"),
                "citations":    p.get("citationCount",0),
                "similarity":   round(sim, 3),
                "similarity_pct": f"{sim*100:.0f}%",
                "arxiv_id":     p.get("externalIds",{}).get("ArXiv"),
                "doi":          p.get("externalIds",{}).get("DOI"),
                "flag":         sim > 0.7,
            })
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results
    except Exception as e:
        log.warning("Similarity search failed: %s", e)
        return []


def _simple_similarity(a: str, b: str) -> float:
    """Jaccard similarity on word sets."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb: return 0.0
    return len(wa & wb) / len(wa | wb)
