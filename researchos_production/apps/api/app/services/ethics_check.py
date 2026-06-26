"""
Issue #49: Ethics checklist for NLP/ML papers (ACL + NeurIPS standards).
"""
from __future__ import annotations
import re
from typing import Any


CHECKLIST = [
    {
        "id":       "human_subjects",
        "question": "Does the paper involve human subjects or personal data?",
        "check":    lambda text: any(w in text.lower() for w in ["crowd", "mturk", "annotation", "human", "survey", "participants", "interview"]),
        "guidance": "If yes: IRB approval, informed consent, and data anonymisation are required.",
    },
    {
        "id":       "harms_discussed",
        "question": "Are potential harms / risks discussed?",
        "check":    lambda text: any(w in text.lower() for w in ["limitation", "harm", "risk", "bias", "fairness", "misuse", "ethical"]),
        "guidance": "Papers should discuss who might be harmed by the work or its misuse.",
    },
    {
        "id":       "dataset_documented",
        "question": "Is the dataset documented (datasheet or data statement)?",
        "check":    lambda text: any(w in text.lower() for w in ["datasheet", "data statement", "data card", "dataset documentation", "data release"]),
        "guidance": "Follow Gebru et al. (2021) Datasheets for Datasets standard.",
    },
    {
        "id":       "compute_reported",
        "question": "Are computational resources / CO₂ emissions reported?",
        "check":    lambda text: any(w in text.lower() for w in ["gpu hours", "compute", "carbon", "co2", "energy", "kwh", "tpu"]),
        "guidance": "Report GPU/TPU hours and estimated CO₂ (use mlco2.ai calculator).",
    },
    {
        "id":       "code_released",
        "question": "Is code / model released for reproducibility?",
        "check":    lambda text: any(w in text.lower() for w in ["github", "code available", "open source", "released", "hugging face", "model card"]),
        "guidance": "Releasing code enables reproducibility. Use GitHub + HuggingFace Hub.",
    },
    {
        "id":       "limitations_stated",
        "question": "Are limitations clearly stated?",
        "check":    lambda text: "limitation" in text.lower() or "future work" in text.lower(),
        "guidance": "ACL 2023+ requires a Limitations section. NeurIPS has a broader impact statement.",
    },
    {
        "id":       "consent_given",
        "question": "Is informed consent obtained for any collected data?",
        "check":    lambda text: any(w in text.lower() for w in ["consent", "gdpr", "privacy", "irb", "ethics board", "approved"]),
        "guidance": "Data collection from humans requires documented consent.",
    },
]


def run_checklist(document_text: str) -> dict[str, Any]:
    """
    Run ethics checklist against paper text.
    Returns pass/fail/warn for each criterion.
    """
    results = []
    passed = 0

    for item in CHECKLIST:
        try:
            found = item["check"](document_text)
        except Exception:
            found = False

        status = "pass" if found else "warn"
        if found: passed += 1

        results.append({
            "id":       item["id"],
            "question": item["question"],
            "status":   status,
            "guidance": item["guidance"] if not found else None,
        })

    score = round(passed / len(CHECKLIST) * 100)
    return {
        "score":         score,
        "passed":        passed,
        "total":         len(CHECKLIST),
        "grade":         "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 55 else "D",
        "results":       results,
        "summary":       f"{passed}/{len(CHECKLIST)} ethics criteria met ({score}%)",
        "disclaimer":    "Automated check only — human ethics review is required for submission.",
    }
