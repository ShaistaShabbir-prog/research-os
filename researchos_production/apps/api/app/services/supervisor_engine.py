"""
Supervisor Engine — heuristic review of research documents.
Scores: Structure, Citation, Methodology, Novelty, Reproducibility, Writing.
"""
import re
from dataclasses import dataclass, asdict

SECTION_PATTERNS = {
    "abstract": r"\babstract\b",
    "introduction": r"\bintroduction\b",
    "related_work": r"\b(related work|literature review|background)\b",
    "methodology": r"\b(methodology|methods|approach|materials and methods)\b",
    "results": r"\b(results|evaluation|experiments)\b",
    "discussion": r"\bdiscussion\b",
    "limitations": r"\b(limitations|threats to validity|validity threats)\b",
    "conclusion": r"\bconclusion\b",
    "references": r"\b(references|bibliography)\b",
}


@dataclass
class Score:
    name: str
    value: float
    rationale: str


def _has(pattern: str, text: str) -> bool:
    return bool(re.search(pattern, text, flags=re.I))


def _citation_count(text: str) -> int:
    return len(re.findall(
        r"\[[0-9,\- ]+\]|\([A-Z][A-Za-z]+ et al\.?,? \d{4}\)|\([A-Z][A-Za-z]+,? \s?\d{4}\)",
        text,
    ))


def _word_count(text: str) -> int:
    return len(re.findall(r"\w+", text))


def review_document(text: str, mode: str = "supervisor", discipline: str = "general") -> dict:
    text = text or ""
    wc = _word_count(text)
    sections = {name: _has(pattern, text) for name, pattern in SECTION_PATTERNS.items()}
    citations = _citation_count(text)
    fig_mentions = len(re.findall(r"\b(fig\.|figure|table)\b", text, flags=re.I))
    method_terms = len(re.findall(
        r"\b(dataset|baseline|ablation|experiment|metric|validation|test set|"
        r"statistical|significant|reproducib|implementation)\b",
        text, flags=re.I,
    ))
    novelty_terms = len(re.findall(
        r"\b(novel|contribution|research gap|state of the art|SOTA|unexplored|first|propose)\b",
        text, flags=re.I,
    ))
    repro_terms = len(re.findall(
        r"\b(code|repository|github|parameters|hyperparameters|seed|environment|docker|data availability)\b",
        text, flags=re.I,
    ))
    informal_terms = len(re.findall(
        r"\b(very|really|basically|stuff|things)\b", text, flags=re.I,
    ))

    structure_score = 3 + 7 * (sum(sections.values()) / len(sections))
    citation_score = min(10, 2 + citations / max(1, wc / 1200))
    methodology_score = min(10, 2 + method_terms / 8)
    novelty_score = min(10, 2 + novelty_terms / 4)
    reproducibility_score = min(10, 2 + repro_terms)
    writing_score = max(3, min(10, 9 - informal_terms / 8))

    scores = [
        Score("Structure", round(structure_score, 1), "Checks whether standard scientific sections are present."),
        Score("Citation support", round(citation_score, 1), f"Detected approximately {citations} citation markers."),
        Score("Methodological rigor", round(methodology_score, 1), "Checks for baselines, metrics, validation, and experiments."),
        Score("Novelty framing", round(novelty_score, 1), "Checks whether contribution and research gap are explicit."),
        Score("Reproducibility", round(reproducibility_score, 1), "Checks for code, dataset, parameters, seed, environment details."),
        Score("Academic writing", round(writing_score, 1), "Heuristic readability and informality check."),
    ]
    overall = round(sum(s.value for s in scores) / len(scores), 1)

    major, minor = [], []
    if not sections["methodology"]:
        major.append("Methodology section is missing or not clearly marked.")
    if not sections["limitations"]:
        major.append("Add a limitations / threats-to-validity section — this improves reviewer trust significantly.")
    if methodology_score < 6:
        major.append("Methodological rigor is weak: add baselines, metrics, validation protocol, and experimental settings.")
    if citation_score < 5:
        major.append("Many claims may be under-supported. Add current and primary-source citations.")
    if novelty_score < 5:
        major.append("The novelty/research-gap framing is weak. State exactly what is new and why it matters.")
    if fig_mentions < 2:
        minor.append("Add or improve figures and tables to make results and methodology easier to inspect.")
    if reproducibility_score < 5:
        minor.append("Add repository link, environment file, seeds, parameters, and a data availability statement.")

    defense_questions = [
        "What is the single most important contribution of your work?",
        "Which baseline is the strongest and why does your method beat it?",
        "What assumption in your methodology is most vulnerable to critique?",
        "How would your method perform on a different dataset or domain?",
        "What are the ethical or practical limitations of the work?",
    ] if mode == "defense" else [
        "What claim is least supported by evidence in your document?",
        "Which single experiment would most strengthen your contribution?",
        "What related work directly challenges or competes with your approach?",
        "Can the reader reproduce the key result from the current description alone?",
    ]

    decision = "Revise before submission"
    if overall >= 8.0:
        decision = "Strong draft — polish and submit"
    elif overall < 5.0:
        decision = "Major revision required"

    return {
        "mode": mode,
        "discipline": discipline,
        "overall_score": overall,
        "decision": decision,
        "scores": [asdict(s) for s in scores],
        "section_presence": sections,
        "major_concerns": major or ["No critical structural issue detected. Request LLM review for deeper critique."],
        "minor_concerns": minor or ["Improve phrasing, figure captions, and transitions between sections."],
        "supervisor_comments": [
            "Separate results from interpretation: results section reports what happened; discussion explains why.",
            "Make every major claim traceable to evidence — a citation, figure, table, or experiment.",
            "End the introduction with an explicit contribution list and clear scope boundaries.",
        ],
        "defense_questions": defense_questions,
        "next_actions": [
            "Add a one-page contribution map: problem → research gap → method → evidence → limitation.",
            "Create a comparison table of datasets, baselines, metrics, and main findings.",
            "Add a reproducibility appendix with environment, parameters, seeds, and data availability.",
        ],
    }
