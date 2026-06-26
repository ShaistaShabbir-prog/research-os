"""
Issue #49: Ethics checklist for AI papers — ACL/NeurIPS criteria.
"""
from __future__ import annotations

CHECKLIST = [
    {"id":"human_subjects",   "question":"Does the work involve human subjects or data about real people?","required":True},
    {"id":"harms_discussed",  "question":"Are potential harms and failure modes explicitly discussed?","required":True},
    {"id":"dataset_card",     "question":"Is there a dataset datasheet / model card?","required":False},
    {"id":"env_impact",       "question":"Are environmental costs (CO₂, compute) reported?","required":False},
    {"id":"code_released",    "question":"Is code/data released for reproducibility?","required":True},
    {"id":"limitations",      "question":"Are limitations clearly stated in the paper?","required":True},
    {"id":"consent",          "question":"Was informed consent obtained for any human data?","required":False},
    {"id":"fairness",         "question":"Were fairness / bias evaluations conducted?","required":False},
    {"id":"privacy",          "question":"Are privacy risks (MIA, membership inference) considered?","required":False},
    {"id":"dual_use",         "question":"Could this work be misused? Is dual-use risk discussed?","required":True},
]


def evaluate(responses: dict[str, bool]) -> dict:
    """
    responses: {"human_subjects": True, "harms_discussed": False, ...}
    Returns pass/fail per item + overall score.
    """
    results = []
    required_fails = []
    for item in CHECKLIST:
        answered = responses.get(item["id"])
        passed   = answered is True
        results.append({**item, "answered": answered, "passed": passed})
        if item["required"] and not passed:
            required_fails.append(item["id"])

    score = sum(1 for r in results if r["passed"]) / len(results)
    return {
        "score":           round(score, 3),
        "score_pct":       f"{score*100:.0f}%",
        "passed":          len(required_fails) == 0,
        "required_fails":  required_fails,
        "results":         results,
        "recommendation":  "✅ Ethics checklist passed" if not required_fails
                           else f"❌ {len(required_fails)} required item(s) need attention",
    }


def checklist_items() -> list[dict]:
    return CHECKLIST
