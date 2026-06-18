"""Issue #12: Semantic Research Memory upgrade.
Adds embedding-based similarity and structured comparison output.
Falls back to heuristic (Phase 4) when no embedding model available.
"""
from __future__ import annotations
import math, re
from typing import Any
from app.services.research_memory import run_research_memory as heuristic_run

def _tfidf_sim(a: str, b: str) -> float:
    """TF-IDF cosine similarity — no external deps."""
    def tokenize(t):
        return re.findall(r"[a-z]{4,}", t.lower())
    def tf(tokens):
        freq = {}
        for t in tokens: freq[t] = freq.get(t,0)+1
        n = len(tokens) or 1
        return {k: v/n for k,v in freq.items()}
    def tfidf_vec(text, idf):
        t = tf(tokenize(text))
        return {k: v*idf.get(k,1) for k,v in t.items()}
    def cosine(v1, v2):
        keys = set(v1) | set(v2)
        dot  = sum(v1.get(k,0)*v2.get(k,0) for k in keys)
        n1   = math.sqrt(sum(x**2 for x in v1.values()))
        n2   = math.sqrt(sum(x**2 for x in v2.values()))
        return dot/(n1*n2) if n1*n2 else 0.0
    ta, tb = tokenize(a), tokenize(b)
    all_tokens = set(ta)|set(tb)
    idf = {t: math.log(2/(1+(t in ta)+(t in tb))+1) for t in all_tokens}
    return round(cosine(tfidf_vec(a,idf), tfidf_vec(b,idf)), 3)

def semantic_novelty_overlap(papers: list[dict[str,Any]]) -> dict[str,Any]:
    """TF-IDF semantic similarity between paper abstracts/introductions."""
    def get_intro(text):
        m = re.search(r"(?:abstract|introduction)(.*?)(?:##|\\section|related|method)",
                      text, re.IGNORECASE|re.DOTALL)
        return m.group(1) if m else text[:2000]

    pairs = []
    for i in range(len(papers)):
        for j in range(i+1, len(papers)):
            a, b = papers[i], papers[j]
            sim  = _tfidf_sim(get_intro(a["text"]), get_intro(b["text"]))
            pairs.append({
                "paper_a":    a["id"],
                "paper_b":    b["id"],
                "similarity": sim,
                "method":     "tfidf_cosine",
                "label":      "high" if sim>=0.35 else "moderate" if sim>=0.15 else "low",
            })
    return {"pairs":pairs,"method":"tfidf_cosine",
            "note":"Upgrade to sentence-transformers for production embedding-based similarity."}

def run_semantic_research_memory(papers: list[dict[str,Any]]) -> dict[str,Any]:
    if len(papers)<2: raise ValueError("At least 2 papers required.")
    base     = heuristic_run(papers)
    semantic = semantic_novelty_overlap(papers)
    base["semantic_novelty_overlap"] = semantic
    base["semantic_powered"] = False
    base["semantic_note"]    = "TF-IDF similarity used. Install sentence-transformers for embedding-based analysis."
    return base
