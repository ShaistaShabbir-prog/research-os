"""
Supervisor Engine — context-aware heuristic review.
Scales scores and comments to what is actually present in the text.
"""
import re
from dataclasses import dataclass, asdict

SECTION_PATTERNS = {
    "abstract":      r"\babstract\b",
    "introduction":  r"\bintroduction\b",
    "related_work":  r"\b(related work|literature review|background)\b",
    "methodology":   r"\b(methodology|methods|approach|materials and methods)\b",
    "results":       r"\b(results|evaluation|experiments)\b",
    "discussion":    r"\bdiscussion\b",
    "limitations":   r"\b(limitations|threats to validity|validity threats)\b",
    "conclusion":    r"\bconclusion\b",
    "references":    r"\b(references|bibliography)\b",
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
        r"\[[0-9,\- ]+\]|\([A-Z][A-Za-z]+ et al\.?,? \d{4}\)|\([A-Z][A-Za-z]+,? \d{4}\)",
        text,
    ))


def _word_count(text: str) -> int:
    return len(re.findall(r"\w+", text))


def _detect_doc_type(text: str, wc: int, sections: dict) -> str:
    """Detect what kind of text was submitted."""
    if wc < 100:
        return "fragment"
    if wc < 350 and sections.get("abstract") and sum(sections.values()) <= 2:
        return "abstract"
    if wc < 600 and not sections.get("methodology") and not sections.get("results"):
        return "abstract_or_intro"
    if wc < 1500 and sum(sections.values()) <= 3:
        return "section"
    if sum(sections.values()) >= 5:
        return "full_paper"
    return "partial_paper"


def review_document(text: str, mode: str = "supervisor", discipline: str = "general") -> dict:
    text = text or ""
    wc = _word_count(text)
    sections = {name: _has(pattern, text) for name, pattern in SECTION_PATTERNS.items()}
    doc_type = _detect_doc_type(text, wc, sections)
    citations = _citation_count(text)
    fig_mentions = len(re.findall(r"\b(fig\.|figure|table)\b", text, flags=re.I))
    method_terms = len(re.findall(
        r"\b(dataset|baseline|ablation|experiment|metric|validation|test set|"
        r"statistical|significant|reproducib|implementation)\b", text, flags=re.I))
    novelty_terms = len(re.findall(
        r"\b(novel|contribution|research gap|state of the art|SOTA|unexplored|first|propose)\b",
        text, flags=re.I))
    repro_terms = len(re.findall(
        r"\b(code|repository|github|parameters|hyperparameters|seed|environment|docker|data availability)\b",
        text, flags=re.I))
    informal_terms = len(re.findall(
        r"\b(very|really|basically|stuff|things|good|bad|nice|amazing|awesome)\b", text, flags=re.I))

    # ── Context-aware scoring ──
    # For abstracts/short sections: only score what makes sense for that doc type
    if doc_type == "abstract":
        # Abstract: score clarity, novelty framing, citation mention
        structure_score = 7.0  # abstracts don't need all sections
        citation_score = min(10, 4 + citations * 2)
        methodology_score = min(10, 4 + method_terms * 1.5)
        novelty_score = min(10, 3 + novelty_terms * 2)
        reproducibility_score = 5.0  # not expected in abstract
        writing_score = max(3, min(10, 9 - informal_terms * 0.5))
    elif doc_type in ("abstract_or_intro", "section"):
        structure_score = 4 + 6 * (sum(sections.values()) / max(3, len(sections)))
        citation_score = min(10, 2 + citations / max(1, wc / 400))
        methodology_score = min(10, 2 + method_terms / 4)
        novelty_score = min(10, 2 + novelty_terms * 1.5)
        reproducibility_score = min(10, 2 + repro_terms * 2)
        writing_score = max(3, min(10, 9 - informal_terms * 0.4))
    else:
        # Full paper or partial paper
        structure_score = 3 + 7 * (sum(sections.values()) / len(sections))
        citation_score = min(10, 2 + citations / max(1, wc / 1200))
        methodology_score = min(10, 2 + method_terms / 8)
        novelty_score = min(10, 2 + novelty_terms / 4)
        reproducibility_score = min(10, 2 + repro_terms)
        writing_score = max(3, min(10, 9 - informal_terms / 8))

    scores = [
        Score("Structure",           round(structure_score, 1),       f"Evaluated as: {doc_type.replace('_',' ')}. {'Standard sections checked.' if doc_type == 'full_paper' else 'Limited sections expected for this doc type.'}" ),
        Score("Citation support",    round(citation_score, 1),        f"Found ~{citations} citation markers in {wc} words."),
        Score("Methodological rigor",round(methodology_score, 1),     "Checks for baselines, metrics, validation, and experiments."),
        Score("Novelty framing",     round(novelty_score, 1),         "Checks whether contribution and research gap are stated."),
        Score("Reproducibility",     round(reproducibility_score, 1), "Checks for code, data, parameters, environment references."),
        Score("Academic writing",    round(writing_score, 1),         f"Found {informal_terms} informal term(s). Heuristic readability check."),
    ]
    overall = round(sum(s.value for s in scores) / len(scores), 1)

    # ── Context-aware comments ──
    major, minor = [], []

    if doc_type == "fragment":
        major.append("The submitted text is very short (<100 words). Please submit a complete abstract, section, or full draft for meaningful analysis.")

    elif doc_type == "abstract":
        # Abstract-specific feedback
        if not _has(r"\b(propose|present|introduce|develop|investigate)\b", text, ):
            minor.append("Abstract: state clearly what this paper proposes or investigates (e.g. 'We propose…').")
        if not _has(r"\b(result|achiev|outperform|accuracy|f1|score|improve)\b", text):
            minor.append("Abstract: include a key quantitative result (accuracy, F1, improvement %) to strengthen impact.")
        if not _has(r"\b(dataset|data|experiment|evaluat)\b", text):
            minor.append("Abstract: mention the dataset or evaluation setup so reviewers know the experimental basis.")
        if citations == 0:
            minor.append("Abstracts typically do not require citations — this looks fine.")
        if novelty_terms == 0:
            major.append("Abstract: the novelty/contribution is not explicit. Add a phrase like 'Unlike prior work…' or 'This is the first…'.")
        if wc < 100:
            minor.append(f"Abstract is only {wc} words — most venues require 150–250 words.")
        elif wc > 350:
            minor.append(f"Abstract is {wc} words — most venues limit abstracts to 250 words.")

    elif doc_type in ("section", "abstract_or_intro"):
        if not sections["methodology"] and not sections["introduction"]:
            major.append("Cannot identify this section type clearly. Add a clear section heading (e.g. 'Methodology', 'Introduction').")
        if citation_score < 5:
            major.append("This section appears under-cited. Each major claim needs a reference.")
        if methodology_score < 5 and sections.get("methodology"):
            major.append("Methodology section: add baselines, evaluation metrics, dataset description, and validation protocol.")
        if novelty_score < 4:
            minor.append("This section could more clearly state its contribution relative to prior work.")

    else:
        # Full/partial paper feedback
        if not sections["methodology"]:
            major.append("Methodology section is missing or not clearly marked.")
        if not sections["limitations"]:
            major.append("Add a limitations / threats-to-validity section — this significantly improves reviewer trust.")
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

    # ── Context-aware supervisor comments ──
    if doc_type == "abstract":
        supervisor_comments = [
            "An abstract should answer: What problem? What method? What result? What conclusion? Check each is present.",
            "Keep abstracts self-contained — a reader should understand the core contribution without reading the paper.",
            "Quantitative results in the abstract ('94.2% accuracy') are far more compelling than qualitative claims ('improved performance').",
        ]
        defense_questions = [
            "What is the single most important contribution of this paper?",
            "How does this work differ from the most closely related prior work?",
            "What would make this result invalid or unreliable?",
        ]
    elif doc_type in ("section", "abstract_or_intro"):
        supervisor_comments = [
            "Make every claim in this section traceable to evidence, citation, or data.",
            "End each paragraph with a clear point — avoid trailing sentences that introduce new ideas without developing them.",
            "Use topic sentences: the first sentence of each paragraph should summarise its content.",
        ]
        defense_questions = [
            "What claim in this section is least supported by evidence?",
            "How does this section connect to the overall research question?",
            "What would a skeptical reviewer challenge in this section?",
        ]
    else:
        supervisor_comments = [
            "Separate results from interpretation: results report what happened; discussion explains why.",
            "Make every major claim traceable to a citation, figure, table, or experiment.",
            "End the introduction with an explicit contribution list and clear scope boundaries.",
        ]
        defense_questions = [
            "What is the single most important contribution of your work?",
            "Which baseline is the strongest and why does your method beat it?",
            "What assumption in your methodology is most vulnerable to critique?",
            "How would your method perform on a different dataset or domain?",
            "What are the ethical or practical limitations of the work?",
        ] if mode == "defense" else [
            "What claim is least supported by evidence?",
            "Which single experiment would most strengthen the contribution?",
            "What related work directly challenges your approach?",
            "Can the reader reproduce the key result from the current description alone?",
        ]

    # Decision
    decision = "Revise before submission"
    if overall >= 8.0:
        decision = "Strong draft — polish and submit"
    elif overall < 5.0:
        decision = "Major revision required"

    return {
        "mode": mode,
        "discipline": discipline,
        "doc_type": doc_type,
        "word_count": wc,
        "overall_score": overall,
        "decision": decision,
        "scores": [asdict(s) for s in scores],
        "section_presence": sections,
        "major_concerns": major or ["No critical issues detected for this document type."],
        "minor_concerns": minor or ["Good start — see supervisor comments for improvement areas."],
        "supervisor_comments": supervisor_comments,
        "defense_questions": defense_questions,
        "next_actions": _next_actions(doc_type, sections, overall),
    }


def _next_actions(doc_type: str, sections: dict, overall: float) -> list:
    if doc_type == "abstract":
        return [
            "Verify the abstract answers: Problem → Method → Result → Conclusion.",
            "Add one specific quantitative result if not already present.",
            "Check word count against target venue guidelines (usually 150–250 words).",
        ]
    if doc_type in ("section", "abstract_or_intro"):
        return [
            "Add a clear section heading if missing.",
            "Review every claim and ensure it has a citation or supporting evidence.",
            "Add a closing sentence that connects this section to the overall paper.",
        ]
    return [
        "Add a contribution map: problem → gap → method → evidence → limitation.",
        "Create a comparison table of datasets, baselines, metrics, and main findings.",
        "Add a reproducibility appendix with environment, parameters, seeds, and data availability.",
    ]
