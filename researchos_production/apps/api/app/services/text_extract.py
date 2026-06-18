"""Structured text extraction from PDF, DOCX, and plain text.

Phase 17: layout-aware PDF extraction.
Handles:
  - Text-based PDFs (pdfminer): preserves column order, headings, tables
  - Table detection: extracts result tables as Markdown
  - Reference parsing: structured bibliography (title, authors, year, venue, DOI)
  - Figure caption extraction
  - 2-column IEEE/ACM layout decolumning
  - Scanned/image PDFs: graceful fallback with clear message
"""
from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from typing import Any


# ── Data model ────────────────────────────────────────────────────────────

@dataclass
class ExtractedPaper:
    raw_text:      str             = ""
    sections:      list[dict]      = field(default_factory=list)
    tables:        list[dict]      = field(default_factory=list)
    references:    list[dict]      = field(default_factory=list)
    figures:       list[dict]      = field(default_factory=list)
    metadata:      dict            = field(default_factory=dict)
    warnings:      list[str]       = field(default_factory=list)
    page_count:    int             = 0
    char_count:    int             = 0
    is_scanned:    bool            = False
    extraction_method: str         = "unknown"


# ── Public entry point ────────────────────────────────────────────────────

def extract_text(filename: str, content: bytes) -> str:
    """Legacy interface — returns plain text string."""
    name = filename.lower()
    if name.endswith(".pdf"):
        paper = extract_structured(filename, content)
        return paper.raw_text or _pdf_fallback(content)
    if name.endswith(".docx"):
        return _docx(content)
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1", errors="replace")


def extract_structured(filename: str, content: bytes) -> ExtractedPaper:
    """
    Full structured extraction. Returns ExtractedPaper with sections,
    tables, references, figures, and metadata.
    """
    name = filename.lower()
    if name.endswith(".pdf"):
        return _extract_pdf_structured(content)
    if name.endswith(".docx"):
        text = _docx(content)
        return _structure_from_text(text, method="docx")
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1", errors="replace")
    return _structure_from_text(text, method="plaintext")


# ── PDF extraction ────────────────────────────────────────────────────────

def _extract_pdf_structured(content: bytes) -> ExtractedPaper:
    """Try pdfminer first, fall back to pypdf, then report scanned."""
    paper = ExtractedPaper()

    # Try pdfminer (best for academic PDFs)
    text, page_count = _pdfminer_extract(content)
    if text and len(text.strip()) > 100:
        paper.extraction_method = "pdfminer"
        paper.page_count  = page_count
        paper.raw_text    = _decolumn(text)
        paper.char_count  = len(paper.raw_text)
        paper.sections    = _extract_sections(paper.raw_text)
        paper.tables      = _extract_tables(paper.raw_text)
        paper.references  = _extract_references_structured(paper.raw_text)
        paper.figures     = _extract_figures(paper.raw_text)
        paper.metadata    = _extract_pdf_metadata(content)
        return paper

    # Try pypdf fallback
    text2, page_count2 = _pypdf_extract(content)
    if text2 and len(text2.strip()) > 100:
        paper.extraction_method = "pypdf_fallback"
        paper.page_count  = page_count2
        paper.raw_text    = _decolumn(text2)
        paper.char_count  = len(paper.raw_text)
        paper.sections    = _extract_sections(paper.raw_text)
        paper.tables      = _extract_tables(paper.raw_text)
        paper.references  = _extract_references_structured(paper.raw_text)
        paper.figures     = _extract_figures(paper.raw_text)
        paper.warnings.append(
            "pdfminer unavailable — used pypdf fallback. "
            "Table and equation extraction may be incomplete."
        )
        return paper

    # Scanned / image PDF
    paper.is_scanned = True
    paper.extraction_method = "scanned_detected"
    paper.raw_text = (
        "[SCANNED PDF] This PDF appears to be image-based or scanned. "
        "Text extraction is not available. Please paste the paper text manually, "
        "or use a tool like Adobe Acrobat OCR before uploading."
    )
    paper.warnings.append(
        "PDF appears to be scanned or image-only. No text could be extracted."
    )
    return paper


def _pdfminer_extract(content: bytes) -> tuple[str, int]:
    """Extract with pdfminer.six — best for layout-aware extraction."""
    try:
        from pdfminer.high_level import extract_pages
        from pdfminer.layout import LAParams, LTAnno, LTChar, LTTextBox, LTTextLine

        laparams = LAParams(
            line_overlap=0.5,
            char_margin=2.0,
            line_margin=0.5,
            word_margin=0.1,
            boxes_flow=0.5,    # 0.5 balances horizontal/vertical order
            detect_vertical=False,
            all_texts=False,
        )

        pages_text: list[str] = []
        page_count = 0

        for page_layout in extract_pages(io.BytesIO(content), laparams=laparams):
            page_count += 1
            if page_count > 50:   # cap at 50 pages
                break

            page_lines: list[str] = []
            for element in sorted(page_layout, key=lambda e: -e.y1):
                if isinstance(element, LTTextBox):
                    box_text = ""
                    for line in element:
                        if isinstance(line, LTTextLine):
                            line_chars = ""
                            for char in line:
                                if isinstance(char, (LTChar, LTAnno)):
                                    line_chars += char.get_text()
                            box_text += line_chars
                    if box_text.strip():
                        page_lines.append(box_text.strip())

            pages_text.append("\n".join(page_lines))

        return "\n\n".join(pages_text), page_count

    except ImportError:
        return "", 0
    except Exception:
        return "", 0


def _pypdf_extract(content: bytes) -> tuple[str, int]:
    """Fallback: pypdf (no layout awareness but widely available)."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages  = [p.extract_text() or "" for p in reader.pages[:50]]
        return "\n\n".join(p for p in pages if p.strip()), len(reader.pages)
    except Exception:
        return "", 0


def _pdf_fallback(content: bytes) -> str:
    """Legacy plain-text fallback."""
    text, _ = _pdfminer_extract(content)
    if text.strip():
        return text
    text2, _ = _pypdf_extract(content)
    if text2.strip():
        return text2
    return "[PDF text extraction failed — paste text manually.]"


# ── Layout processing ─────────────────────────────────────────────────────

_COLUMN_SPLIT = re.compile(r"(.{40,})\s{4,}(.{40,})")

def _decolumn(text: str) -> str:
    """
    Heuristic 2-column decolumning for IEEE/ACM papers.
    Lines with large mid-gaps are likely 2-column — join sensibly.
    """
    lines   = text.split("\n")
    result  = []
    for line in lines:
        m = _COLUMN_SPLIT.match(line)
        if m:
            result.append(m.group(1).rstrip())
            result.append(m.group(2).lstrip())
        else:
            result.append(line)
    return "\n".join(result)


# ── Section extraction ────────────────────────────────────────────────────

_SECTION_RE = re.compile(
    r"^(?:#{1,3}\s+(?:\d+\.?\d*\.?\s+)?|\d+\.?\d*\.?\s+)([A-Z][^\n]{2,80})$",
    re.MULTILINE,
)
_LATEX_SEC  = re.compile(
    r"\\(?:section|subsection|subsubsection)\{([^}]+)\}", re.I
)

def _extract_sections(text: str) -> list[dict[str, Any]]:
    sections: list[dict] = []
    matches  = list(_SECTION_RE.finditer(text)) + list(_LATEX_SEC.finditer(text))
    matches  = sorted(matches, key=lambda m: m.start())

    for i, m in enumerate(matches):
        start   = m.end()
        end     = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body    = text[start:end].strip()
        title   = m.group(1).strip()
        sections.append({
            "title": title,
            "text":  body[:2000],
            "start_char": m.start(),
            "end_char":   end,
            "word_count": len(body.split()),
        })
    return sections


# ── Table extraction ──────────────────────────────────────────────────────

_TABLE_CAPTION = re.compile(
    r"(?im)(?:Table|TABLE)\s+(\d+)[.:\s]+([^\n]{5,120})"
)
_PIPE_TABLE    = re.compile(r"^\|.+\|$", re.MULTILINE)
_NUMERIC_ROW   = re.compile(r"^\s*\S+(?:\s+\d[\d.%\s±]+){2,}", re.MULTILINE)

def _extract_tables(text: str) -> list[dict[str, Any]]:
    tables: list[dict] = []

    # 1. Captioned tables
    for m in _TABLE_CAPTION.finditer(text):
        num     = m.group(1)
        caption = m.group(2).strip()
        # Grab lines after caption as table body
        body_start = m.end()
        body_end   = min(body_start + 600, len(text))
        body_text  = text[body_start:body_end].strip()
        tables.append({
            "table_number": int(num),
            "caption":      caption,
            "raw_text":     body_text[:400],
            "markdown":     _rows_to_markdown(body_text),
            "start_char":   m.start(),
        })

    # 2. Pipe-style Markdown tables
    for m in _PIPE_TABLE.finditer(text):
        if not any(t["start_char"] == m.start() for t in tables):
            tables.append({
                "table_number": len(tables) + 1,
                "caption":      "Detected table (no caption)",
                "raw_text":     m.group()[:300],
                "markdown":     m.group()[:300],
                "start_char":   m.start(),
            })

    return tables


def _rows_to_markdown(raw: str) -> str:
    """Convert raw tabular text to a simple Markdown table."""
    lines = [l.strip() for l in raw.split("\n") if l.strip()]
    if not lines:
        return raw[:200]
    # Use first line as header
    header = " | ".join(re.split(r"\s{2,}|\t", lines[0]))
    sep    = " | ".join(["---"] * max(1, header.count("|") + 1))
    rows   = []
    for line in lines[1:6]:
        cols = re.split(r"\s{2,}|\t", line)
        rows.append(" | ".join(cols))
    return f"| {header} |\n| {sep} |\n" + "\n".join(f"| {r} |" for r in rows)


# ── Reference parsing ─────────────────────────────────────────────────────

_REF_HEADING  = re.compile(
    r"(?im)^(?:#{0,3}\s*)?(?:References|Bibliography|REFERENCES|BIBLIOGRAPHY)\s*$"
)
_REF_ENTRY    = re.compile(
    r"(?:^\[\d+\]|^\d+\.\s)(.+?)(?=(?:^\[\d+\]|^\d+\.\s)|\Z)",
    re.MULTILINE | re.DOTALL,
)
_YEAR_IN_REF  = re.compile(r"\b((?:19|20)\d{2})\b")
_DOI_RE       = re.compile(r"10\.\d{4,}/\S+")
_AUTHOR_RE    = re.compile(
    r"^([A-Z][a-z]+(?:,?\s+[A-Z]\.?)+(?:,\s+[A-Z][a-z]+(?:,?\s+[A-Z]\.?)+)*)"
)

def _extract_references_structured(text: str) -> list[dict[str, Any]]:
    """Extract structured reference list from paper."""
    # Find references section
    hm = _REF_HEADING.search(text)
    ref_text = text[hm.end():] if hm else text[-4000:]

    refs: list[dict] = []
    for m in _REF_ENTRY.finditer(ref_text):
        entry = m.group(1).replace("\n", " ").strip()
        if len(entry) < 10:
            continue

        year_m  = _YEAR_IN_REF.search(entry)
        doi_m   = _DOI_RE.search(entry)
        auth_m  = _AUTHOR_RE.match(entry)

        refs.append({
            "raw":     entry[:300],
            "year":    int(year_m.group(1)) if year_m else None,
            "doi":     doi_m.group() if doi_m else None,
            "authors": auth_m.group(1).strip() if auth_m else None,
            "is_recent": (int(year_m.group(1)) >= 2020) if year_m else False,
        })

    return refs[:80]


# ── Figure extraction ─────────────────────────────────────────────────────

_FIG_CAPTION = re.compile(
    r"(?im)(?:Fig(?:ure|\.)?|FIGURE)\s*\.?\s*(\d+)[.:]\s*([^\n]{5,200})"
)

def _extract_figures(text: str) -> list[dict[str, Any]]:
    figures = []
    for m in _FIG_CAPTION.finditer(text):
        figures.append({
            "figure_number": int(m.group(1)),
            "caption":       m.group(2).strip()[:200],
            "start_char":    m.start(),
        })
    return figures


# ── PDF metadata ──────────────────────────────────────────────────────────

def _extract_pdf_metadata(content: bytes) -> dict[str, Any]:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        meta   = reader.metadata or {}
        return {
            "title":    meta.get("/Title", ""),
            "author":   meta.get("/Author", ""),
            "subject":  meta.get("/Subject", ""),
            "creator":  meta.get("/Creator", ""),
            "pages":    len(reader.pages),
        }
    except Exception:
        return {}


# ── DOCX extraction ───────────────────────────────────────────────────────

def _docx(content: bytes) -> str:
    try:
        import zipfile, xml.etree.ElementTree as ET
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            with z.open("word/document.xml") as f:
                tree = ET.parse(f)
        paragraphs = [
            "".join(t.text or "" for t in p.findall(".//w:t", ns))
            for p in tree.findall(".//w:p", ns)
        ]
        return "\n".join(p for p in paragraphs if p.strip())
    except Exception:
        return "[DOCX extraction failed]"


# ── Structure from plain text ─────────────────────────────────────────────

def _structure_from_text(text: str, method: str = "plaintext") -> ExtractedPaper:
    paper = ExtractedPaper()
    paper.raw_text         = text
    paper.char_count       = len(text)
    paper.extraction_method = method
    paper.sections         = _extract_sections(text)
    paper.tables           = _extract_tables(text)
    paper.references       = _extract_references_structured(text)
    paper.figures          = _extract_figures(text)
    return paper
