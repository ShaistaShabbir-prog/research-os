"""Review Copilot engine for research-quality and peer-review assistance.

The module is intentionally heuristic-first for the MVP. It assists reviewers
and supervisors, surfaces evidence spans, and keeps human verification explicit.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from typing import Any
from xml.sax.saxutils import escape

ETHICS_WARNINGS = [
    "The system assists, but does not replace human scientific judgment.",
    "Do not submit AI-generated reviews without human verification.",
    "The reviewer remains responsible for correctness, fairness, and confidentiality.",
    "No paper content should be sent to external APIs unless explicitly configured.",
]

MIN_INPUT_CHARS = 30
MAX_INPUT_CHARS = 200_000

SECTION_RE = re.compile(r"^(?P<prefix>#{1,6}|\d+(?:\.\d+)*\.?)\s+(?P<title>[A-Z][^\n]{2,120})$", re.M)
LATEX_SECTION_RE = re.compile(r"\\(?P<kind>section|subsection|subsubsection)\{(?P<title>[^}]+)\}")
REFERENCE_HEADING_RE = re.compile(r"(?im)^\s*#{0,6}\s*(?:references|bibliography)\s*$")
CITATION_RE = re.compile(r"\[[0-9,\-\s]+\]|\([A-Z][A-Za-z-]+(?: et al\.)?,\s*(?:19|20)\d{2}\)")
YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
OVERCLAIM_RE = re.compile(r"\b(first|only|guarantee|prove|solves|always|never|state-of-the-art|outperforms all)\b", re.I)
CAUSAL_RE = re.compile(r"\b(causes?|leads to|results in|because of|due to)\b", re.I)
EVIDENCE_RE = re.compile(r"\b(experiment|result|table|figure|p\s*<|confidence interval|ablation|baseline)\b", re.I)

REPRO_CHECKS = {
    "code_availability": ["code available", "github", "repository", "source code"],
    "dataset_availability": ["dataset", "data available", "benchmark"],
    "preprocessing_details": ["preprocess", "tokenization", "normalization", "cleaning"],
    "hyperparameters": ["hyperparameter", "learning rate", "batch size", "epochs"],
    "random_seeds": ["random seed", "seed"],
    "hardware_software_environment": ["gpu", "hardware", "software", "environment", "cuda"],
    "baselines": ["baseline", "compared with"],
    "ablations": ["ablation", "component study"],
    "statistical_significance": ["statistical significance", "p-value", "confidence interval", "standard deviation"],
    "limitations": ["limitation", "threats to validity"],
}


def finding(
    category: str,
    title: str,
    description: str,
    section_reference: str,
    suggested_action: str,
    severity: str = "medium",
    confidence: float = 0.58,
) -> dict[str, Any]:
    return {
        "category": category,
        "title": title,
        "description": description[:700],
        "severity": severity,
        "priority": "high" if severity == "high" else "medium",
        "evidence_span": {
            "text": description[:300],
            "start_char": None,
            "end_char": None,
        },
        "section_reference": section_reference,
        "suggested_action": suggested_action,
        "confidence": confidence,
        "human_verification_required": True,
    }


class LocalMockProvider:
    name = "local-mock"

    def generate_json(self, task: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "task": task,
            "provider": self.name,
            "confidence": 0.5,
            "human_verification_required": True,
            "title": payload.get("title", "Untitled Paper"),
        }


class OpenAIProvider:
    name = "openai"

    def generate_json(self, task: str, payload: dict[str, Any]) -> dict[str, Any]:
        raise RuntimeError("OpenAIProvider must be explicitly configured before paper content can leave ResearchOS.")


class FutureAnthropicProvider:
    name = "future-anthropic"

    def generate_json(self, task: str, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Anthropic support is reserved for a future configured provider.")


def parse_paper(text: str) -> dict[str, Any]:
    text = text or ""
    title = _extract_title(text)
    abstract = _extract_abstract(text)
    sections = _extract_sections(text)
    references = _extract_references(text)
    figures_tables = [
        f"{kind}: {caption.strip()}"
        for kind, caption in re.findall(r"(?im)^\s*(Figure|Table)\s+\d+[:.]\s+(.+)$", text)
    ]
    return {
        "title": title,
        "abstract": abstract,
        "sections": sections,
        "references": references,
        "figures_tables": figures_tables,
        "raw_text": text,
    }


def generate_reviewer_analysis(paper: dict[str, Any]) -> dict[str, Any]:
    provider = LocalMockProvider()
    provider.generate_json("reviewer_workspace", paper)
    text = paper.get("raw_text", "")
    abstract = paper.get("abstract") or text[:500]
    methods = _find_section(paper, "method")
    results = _find_section(paper, "result|experiment|evaluation")

    return {
        "paper_summary": f"{paper.get('title', 'Untitled Paper')}: {abstract[:700] or 'No abstract detected.'}",
        "novelty_analysis": [
            finding("novelty", "Novelty requires related-work comparison", abstract, "Abstract", "Compare the claimed contribution against current related work.")
        ],
        "strengths": [
            finding("strength", "Structured paper available", "Paper structure was extracted for reviewer inspection.", "Paper", "Verify the parse before relying on findings.", "low")
        ],
        "weaknesses": [
            finding("weakness", "Automated critique requires expert review", abstract, "Paper", "Use findings as a checklist, not a decision.")
        ],
        "methodology_critique": [
            finding("methodology", "Inspect methodology detail", (methods or {}).get("text", abstract), (methods or {}).get("title", "Methods"), "Verify assumptions, controls, and evaluation protocol.")
        ],
        "missing_baselines": [] if "baseline" in text.lower() else [
            finding("missing_baseline", "Baselines not obvious", (results or {}).get("text", abstract), (results or {}).get("title", "Results"), "Ask authors to justify baseline coverage.", "high")
        ],
        "missing_ablations": [] if "ablation" in text.lower() else [
            finding("missing_ablation", "Ablations not obvious", (results or {}).get("text", abstract), (results or {}).get("title", "Results"), "Check whether component-level evidence is needed.", "high")
        ],
        "limitations": [] if "limitation" in text.lower() else [
            finding("limitation", "Limitations section not detected", abstract, "Discussion", "Request a limitations statement or verify it exists under another heading.")
        ],
        "ethical_concerns": [] if re.search(r"\b(ethic|privacy|consent|bias)\b", text, re.I) else [
            finding("ethics", "Ethics discussion not detected", abstract, "Paper", "Check whether the domain requires an ethics statement.")
        ],
        "reproducibility_concerns": [] if "code" in text.lower() else [
            finding("reproducibility", "Code availability unclear", abstract, "Paper", "Ask for code availability or implementation details.")
        ],
        "reviewer_questions": [
            finding("question", "What evidence supports the main claim?", abstract, "Abstract", "Ask authors to point to the exact experiment supporting the claim.")
        ],
        "confidence": 0.58,
        "human_verification_required": True,
    }


def audit_citations(paper: dict[str, Any]) -> dict[str, Any]:
    text = paper.get("raw_text", "")
    mentions = CITATION_RE.findall(text)
    concentration = Counter(mentions)
    references = paper.get("references", [])
    findings: list[dict[str, Any]] = []

    if len(references) < 5:
        findings.append(finding("weak_citation_coverage", "Sparse reference list", f"Only {len(references)} references were parsed.", "References", "Add or verify coverage of relevant prior work.", "high"))
    if concentration and concentration.most_common(1)[0][1] >= 4:
        mention, count = concentration.most_common(1)[0]
        findings.append(finding("citation_concentration", "Citation concentration detected", f"{mention} appears {count} times.", "Paper", "Check whether claims rely too heavily on a narrow source set."))
    for ref in references:
        if ref.get("suspicious"):
            findings.append(finding("suspicious_reference", "Reference needs human verification", ref.get("raw", ""), "References", "Verify bibliographic metadata and source existence."))
    if "related work" not in text.lower():
        findings.append(finding("missing_related_work", "Related work section not detected", paper.get("abstract") or paper.get("title", ""), "Paper", "Check whether related work is integrated under another section."))

    return {"report_type": "citation_audit", "findings": findings, "confidence": 0.55, "human_verification_required": True}


def audit_claims(paper: dict[str, Any]) -> dict[str, Any]:
    findings: list[dict[str, Any]] = []
    for sentence in re.split(r"(?<=[.!?])\s+", paper.get("abstract", "")):
        if len(sentence) >= 30 and OVERCLAIM_RE.search(sentence):
            findings.append(finding("overclaiming", "Potential abstract overclaim", sentence, "Abstract", "Ask authors to qualify or substantiate the claim.", "high", 0.52))
    for section in paper.get("sections", []):
        for sentence in re.split(r"(?<=[.!?])\s+", section.get("text", "")):
            if len(sentence) < 30:
                continue
            if OVERCLAIM_RE.search(sentence):
                findings.append(finding("overclaiming", "Potential overclaim", sentence, section.get("title", "Section"), "Ask authors to qualify or substantiate the claim.", "high", 0.52))
            if CAUSAL_RE.search(sentence) and not EVIDENCE_RE.search(section.get("text", "")):
                findings.append(finding("unsupported_causal_claim", "Causal language without obvious evidence", sentence, section.get("title", "Section"), "Verify experimental design supports causal language.", "high", 0.52))

    results_text = " ".join(s.get("text", "") for s in paper.get("sections", []) if re.search(r"result|experiment|evaluation", s.get("title", ""), re.I))
    if OVERCLAIM_RE.search(paper.get("abstract", "")) and not EVIDENCE_RE.search(results_text):
        findings.append(finding("abstract_results_mismatch", "Abstract claim may exceed results", paper.get("abstract", ""), "Abstract", "Compare abstract/conclusion claims against reported metrics.", "high", 0.52))

    return {"report_type": "claim_audit", "findings": findings, "confidence": 0.52, "human_verification_required": True}


def audit_reproducibility(paper: dict[str, Any]) -> dict[str, Any]:
    text = paper.get("raw_text", "").lower()
    checks = {name: any(term in text for term in terms) for name, terms in REPRO_CHECKS.items()}
    findings = [
        finding(
            "reproducibility",
            f"Missing {name.replace('_', ' ')}",
            f"No clear report of {name.replace('_', ' ')} was detected.",
            "Paper",
            f"Ask authors to provide or clarify {name.replace('_', ' ')}.",
            "high" if name in {"code_availability", "dataset_availability", "baselines"} else "medium",
            0.6,
        )
        for name, present in checks.items()
        if not present
    ]
    return {**checks, "findings": findings, "confidence": 0.6, "human_verification_required": True}


def synthesize_meta_review(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    summaries = [f"{r.get('reviewer_id', 'Reviewer')}: {r.get('summary', '')}" for r in reviews]
    recommendations = Counter((r.get("recommendation") or "unclear").lower() for r in reviews)
    points = [p.lower() for r in reviews for p in (r.get("strengths", []) + r.get("weaknesses", []))]
    repeated = [p for p, count in Counter(points).items() if count > 1]
    joined = " ".join(summaries + points).lower()

    agreement = [finding("agreement", "Repeated review point", p, "Reviewer Reports", "Reflect this consensus in the meta-review.") for p in repeated]
    disagreement = []
    if len(recommendations) > 1:
        disagreement.append(finding("disagreement", "Reviewer recommendations differ", str(dict(recommendations)), "Reviewer Reports", "Ask reviewers to discuss decision-critical disagreements.", "high"))

    missing = [
        finding("missing_discussion", f"{topic.title()} not discussed", joined[:300], "Reviewer Reports", f"Consider whether {topic} should be addressed.")
        for topic in ["reproducibility", "ethics", "limitations"]
        if topic not in joined
    ]
    quality = [
        finding("review_quality", "Very short review summary", r.get("summary", ""), r.get("reviewer_id", "Reviewer"), "Request more specific evidence from this reviewer.")
        for r in reviews
        if len((r.get("summary") or "").split()) < 8
    ]
    balanced = "The reviews should be read as decision support, not a replacement for area-chair judgment. "
    balanced += f"Recommendations are distributed as {dict(recommendations)}. "
    balanced += "Consensus and disagreement points should be verified against the paper before communicating a decision."

    return {
        "review_summaries": summaries,
        "agreement_points": agreement,
        "disagreement_points": disagreement,
        "missing_discussion_points": missing,
        "review_quality_issues": quality,
        "balanced_meta_review": balanced,
        "author_clarification_questions": [
            "Which result most directly supports the central contribution claim?",
            "Can the authors clarify reproducibility artifacts and any limitations not stated explicitly?",
        ],
        "confidence": 0.57,
        "human_verification_required": True,
    }


def build_research_kg(paper: dict[str, Any], reviewer: dict[str, Any], audits: list[dict[str, Any]]) -> dict[str, Any]:
    nodes = [{"id": "paper:main", "type": "paper", "label": paper.get("title", "Untitled Paper")}]
    edges: list[dict[str, str]] = []
    for i, section in enumerate(paper.get("sections", [])):
        node_id = f"section:{i}"
        nodes.append({"id": node_id, "type": "section", "label": section.get("title", "Section")})
        edges.append({"source": "paper:main", "target": node_id, "relation": "paper_has_section"})
    for i, ref in enumerate(paper.get("references", [])):
        node_id = f"citation:{i}"
        nodes.append({"id": node_id, "type": "citation", "label": ref.get("title") or ref.get("raw", "")[:80]})
        edges.append({"source": "paper:main", "target": node_id, "relation": "claim_cites"})
    for audit in audits:
        for i, item in enumerate(audit.get("findings", [])):
            node_id = f"{audit.get('report_type', 'audit')}:finding:{i}"
            nodes.append({"id": node_id, "type": "weakness", "label": item.get("title", "Finding"), "severity": item.get("severity", "medium")})
            edges.append({"source": "paper:main", "target": node_id, "relation": "reviewer_flags"})
    for i, item in enumerate(reviewer.get("reviewer_questions", [])):
        node_id = f"recommendation:{i}"
        nodes.append({"id": node_id, "type": "recommendation", "label": item.get("suggested_action", "Recommendation")})
        edges.append({"source": node_id, "target": "paper:main", "relation": "recommendation_addresses"})
    return {"nodes": nodes, "edges": edges}


def export_markdown_and_json(result: dict[str, Any]) -> dict[str, str]:
    review = result["reviewer_analysis"]
    repro = result["reproducibility_audit"]
    meta = result["meta_review"]
    kg = result["knowledge_graph"]
    graphml_nodes = "\n".join(f'  <node id="{escape(n["id"])}"><data key="label">{escape(str(n.get("label", "")))}</data></node>' for n in kg["nodes"])
    graphml_edges = "\n".join(f'  <edge source="{escape(e["source"])}" target="{escape(e["target"])}"><data key="relation">{escape(e["relation"])}</data></edge>' for e in kg["edges"])
    return {
        "review_summary.md": f"# Review Summary\n\n{review['paper_summary']}\n\nHuman verification required: true\n",
        "review_analysis.md": _review_analysis_markdown(review),
        "review_analysis.json": json.dumps(review, indent=2),
        "citation_audit.json": json.dumps(result["citation_audit"], indent=2),
        "claim_audit.json": json.dumps(result["claim_audit"], indent=2),
        "reproducibility_checklist.md": _repro_markdown(repro),
        "meta_review_draft.md": f"# Meta-Review Draft\n\n{meta['balanced_meta_review']}\n\n## Author Clarification Questions\n" + "\n".join(f"- {q}" for q in meta["author_clarification_questions"]) + "\n",
        "research_kg.graphml": f'<?xml version="1.0" encoding="UTF-8"?>\n<graphml><graph edgedefault="directed">\n{graphml_nodes}\n{graphml_edges}\n</graph></graphml>\n',
}


def validate_review_copilot_input(text: str) -> None:
    chars = len(text or "")
    if chars < MIN_INPUT_CHARS:
        raise ValueError(f"Paper text must be at least {MIN_INPUT_CHARS} characters.")
    if chars > MAX_INPUT_CHARS:
        raise ValueError(f"Paper text must be at most {MAX_INPUT_CHARS} characters.")


def run_review_copilot(text: str, reviews: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    validate_review_copilot_input(text)
    paper = parse_paper(text)
    reviewer = generate_reviewer_analysis(paper)
    citation = audit_citations(paper)
    claims = audit_claims(paper)
    reproducibility = audit_reproducibility(paper)
    meta = synthesize_meta_review(reviews or [])
    kg = build_research_kg(paper, reviewer, [citation, claims])
    result = {
        "paper": paper,
        "reviewer_analysis": reviewer,
        "citation_audit": citation,
        "claim_audit": claims,
        "reproducibility_audit": reproducibility,
        "meta_review": meta,
        "knowledge_graph": kg,
        "ethics": ETHICS_WARNINGS,
    }
    result["exports"] = export_markdown_and_json(result)
    return result


def _extract_title(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip().strip("# ")
        if stripped and stripped.lower() not in {"abstract", "references", "bibliography"}:
            return stripped
    return "Untitled Paper"


def _extract_abstract(text: str) -> str:
    markdown = re.search(r"(?ims)^#{0,6}\s*abstract\s*$([\s\S]*?)(?=^#{1,6}\s+|\n\d+\.?\s+[A-Z]|\\section\{|\Z)", text)
    if markdown:
        return markdown.group(1).strip()
    latex = re.search(r"(?is)\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}", text)
    return latex.group(1).strip() if latex else ""


def _extract_sections(text: str) -> list[dict[str, Any]]:
    paper_title = _extract_title(text)
    reference_heading = REFERENCE_HEADING_RE.search(text)
    reference_start = reference_heading.start() if reference_heading else len(text)
    markers: list[tuple[int, int, str, int]] = []
    for match in SECTION_RE.finditer(text):
        if match.start() >= reference_start:
            continue
        prefix = match.group("prefix")
        level = prefix.count("#") if prefix.startswith("#") else prefix.count(".") + 1
        markers.append((match.start(), match.end(), match.group("title").strip(), level))
    for match in LATEX_SECTION_RE.finditer(text):
        if match.start() >= reference_start:
            continue
        level = {"section": 1, "subsection": 2, "subsubsection": 3}[match.group("kind")]
        markers.append((match.start(), match.end(), match.group("title").strip(), level))
    markers.sort(key=lambda item: item[0])
    sections = []
    for i, marker in enumerate(markers):
        start, end, title, level = marker
        next_start = markers[i + 1][0] if i + 1 < len(markers) else reference_start
        if start == 0 and title == paper_title:
            continue
        if title.lower() not in {"abstract", "references", "bibliography"}:
            sections.append({"title": title, "text": text[end:next_start].strip(), "level": level, "start_char": start, "end_char": next_start})
    if not sections and text.strip():
        sections.append({
            "title": "Full Text",
            "text": text.strip(),
            "level": 1,
            "start_char": 0,
            "end_char": len(text),
        })
    return sections


def _extract_references(text: str) -> list[dict[str, Any]]:
    parts = REFERENCE_HEADING_RE.split(text, maxsplit=1)
    if len(parts) < 2:
        return []
    entries = re.split(r"\n\s*(?:\[\d+\]|\d+\.|\-\s+)", "\n" + parts[1].strip())
    refs = []
    for entry in entries:
        raw = " ".join(entry.split())
        if len(raw) < 20:
            continue
        year = YEAR_RE.search(raw)
        sentence_parts = [part.strip() for part in raw.split(".") if part.strip()]
        refs.append({
            "raw": raw,
            "title": sentence_parts[1] if len(sentence_parts) >= 2 else None,
            "authors": [],
            "year": int(year.group(0)) if year else None,
            "suspicious": year is None or ("doi" not in raw.lower() and "arxiv" not in raw.lower() and len(sentence_parts) < 2),
        })
    return refs


def _find_section(paper: dict[str, Any], pattern: str) -> dict[str, Any] | None:
    for section in paper.get("sections", []):
        if re.search(pattern, section.get("title", ""), re.I):
            return section
    return None


def _repro_markdown(repro: dict[str, Any]) -> str:
    lines = ["# Reproducibility Checklist", ""]
    for key in REPRO_CHECKS:
        lines.append(f"- [{'x' if repro.get(key) else ' '}] {key.replace('_', ' ').title()}")
    lines.extend(["", "Human verification required: true"])
    return "\n".join(lines) + "\n"


def _review_analysis_markdown(review: dict[str, Any]) -> str:
    lines = [
        "# Review Analysis",
        "",
        review.get("paper_summary", ""),
        "",
        "Human verification required: true",
        "",
    ]
    sections = [
        ("Novelty Analysis", review.get("novelty_analysis", [])),
        ("Strengths", review.get("strengths", [])),
        ("Weaknesses", review.get("weaknesses", [])),
        ("Methodology Critique", review.get("methodology_critique", [])),
        ("Missing Baselines", review.get("missing_baselines", [])),
        ("Missing Ablations", review.get("missing_ablations", [])),
        ("Limitations", review.get("limitations", [])),
        ("Ethical Concerns", review.get("ethical_concerns", [])),
        ("Reproducibility Concerns", review.get("reproducibility_concerns", [])),
        ("Reviewer Questions", review.get("reviewer_questions", [])),
    ]
    for title, findings in sections:
        lines.extend([f"## {title}", ""])
        if not findings:
            lines.extend(["- No automated finding. Human verification is still required.", ""])
            continue
        for item in findings:
            lines.extend([
                f"- **{item.get('title', 'Finding')}** ({item.get('severity', 'medium')} severity, {item.get('priority', 'medium')} priority)",
                f"  - Section: {item.get('section_reference', 'Paper')}",
                f"  - Evidence: {item.get('evidence_span', {}).get('text', '')}",
                f"  - Suggested action: {item.get('suggested_action', '')}",
                f"  - Confidence: {item.get('confidence', 0)}",
                "  - Human verification required: true",
            ])
        lines.append("")
    return "\n".join(lines)
