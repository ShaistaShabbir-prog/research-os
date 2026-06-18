"""Issue #15: Conference submission integration.
OpenReview-compatible review import + HotCRP-style export.
"""
from __future__ import annotations
import json, re
from typing import Any

def parse_openreview_json(data: dict | list) -> list[dict[str, Any]]:
    """Parse OpenReview API response into ResearchOS review format."""
    if isinstance(data, dict) and "notes" in data:
        data = data["notes"]
    if not isinstance(data, list):
        raise ValueError("Expected list of OpenReview notes.")
    reviews = []
    for note in data:
        content = note.get("content", {})
        rid     = note.get("id", f"R{len(reviews)+1}")
        rec_raw = content.get("recommendation","").lower()
        rec     = _map_recommendation(rec_raw)
        reviews.append({
            "reviewer_id":    rid[:12],
            "summary":        content.get("summary","") or content.get("review","")[:500],
            "strengths":      _split_bullets(content.get("strengths_and_weaknesses","")
                              or content.get("strengths","")),
            "weaknesses":     _split_bullets(content.get("weaknesses","")
                              or content.get("limitations","")),
            "recommendation": rec,
            "confidence":     content.get("confidence",""),
            "source":         "openreview",
            "note_id":        rid,
        })
    return reviews

def _map_recommendation(raw: str) -> str:
    if "strong accept" in raw or "8" in raw or "9" in raw or "10" in raw:
        return "strong accept"
    if "accept" in raw or "6" in raw or "7" in raw:
        return "weak accept"
    if "borderline" in raw or "5" in raw:
        return "borderline"
    if "reject" in raw or "3" in raw or "4" in raw:
        return "weak reject"
    if "strong reject" in raw or "1" in raw or "2" in raw:
        return "strong reject"
    return "not stated"

def _split_bullets(text: str) -> list[str]:
    if not text: return []
    lines = re.split(r"(?:^|
)\s*[-*•]\s+", text.strip())
    return [l.strip()[:200] for l in lines if l.strip()][:8]

def export_hotcrp(reviews: list[dict], paper_id: str = "1") -> str:
    """Export reviews as HotCRP-compatible JSON string."""
    return json.dumps({
        "pid":     paper_id,
        "reviews": [
            {
                "rid":            r.get("reviewer_id"),
                "overall_merit":  _hotcrp_score(r.get("recommendation","")),
                "summary":        r.get("summary",""),
                "strengths":      " ".join(r.get("strengths",[])),
                "weaknesses":     " ".join(r.get("weaknesses",[])),
                "source":         r.get("source","manual"),
            }
            for r in reviews
        ],
        "generated_by": "ResearchOS",
        "human_verification_required": True,
    }, indent=2)

def _hotcrp_score(rec: str) -> int:
    return {"strong accept":5,"weak accept":4,"borderline":3,"weak reject":2,"strong reject":1}.get(rec.lower(),3)

def detect_venue_format(raw_text: str) -> str:
    """Guess venue format from review text."""
    t=raw_text.lower()
    if "overall merit" in t and "reviewer confidence" in t: return "hotcrp"
    if '"recommendation"' in t or '"confidence"' in t:      return "openreview_json"
    if "summary of the paper" in t:                         return "neurips"
    if "strengths and weaknesses" in t:                     return "iclr"
    return "plain_text"
