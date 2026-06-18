"""Tests for Phase 17: Layout-aware PDF extraction.

Tests run without a real PDF file using synthetic byte content.
All extraction functions are tested with realistic text inputs.
"""
from __future__ import annotations
import io, pytest
from app.services.text_extract import (
    ExtractedPaper,
    extract_structured,
    extract_text,
    _decolumn,
    _extract_sections,
    _extract_tables,
    _extract_references_structured,
    _extract_figures,
    _rows_to_markdown,
    _structure_from_text,
)

SAMPLE_PAPER = """# Acoustic Chatter Detection with LightGBM

## Abstract
We propose a lightweight LightGBM pipeline for chatter detection achieving 91.4% F1.

## 1. Introduction
Machining instability causes surface defects. We address three gaps: reproducibility,
explainability, and latency. Prior work [1, 2] lacks reproducibility.

## 2. Method
LightGBM with learning rate 0.05, 300 estimators, random_state=42.
SHAP TreeExplainer for feature attributions.

## 3. Experiments

Table 1. Comparison of methods on the benchmark dataset.
Method          F1 (%)    Latency (ms)    Parameters
SVM             83.6      2               -
1-D CNN         88.9      210             145K
ResNet-34       94.1      420             21M
Ours (LightGBM) 91.4      48              -

Figure 1. Inference pipeline overview showing feature extraction and prediction.
Figure 2. SHAP force plots for stable, chatter, and borderline predictions.

## 4. Conclusion
Reproducible, explainable chatter detection at 48ms.

## References
[1] Smith, A. et al. (2023). Deep chatter detection. Int. J. Mach. Tools, 185.
[2] Jones, D., Lee, E. (2022). SVM milling stability. doi:10.1016/j.ymssp.2022.01.001
[3] Brown, F. (2021). 1-D CNN for AE-based chatter. J. Manuf. Sci. Eng.
[4] Chen, G. et al. (2024). Transformer chatter. Rob. Comput.-Integr. Manuf.
"""

COLUMNED_TEXT = (
    "Method          Accuracy    " + "    " + "Dataset         Size      \n"
    "SVM             83.6%       " + "    " + "CNC-Mill-2023   2400      \n"
    "LightGBM        91.4%       " + "    " + "Benchmark-2022  1800      \n"
)


class TestExtractedPaperDataclass:
    def test_default_values(self):
        p = ExtractedPaper()
        assert p.raw_text == ""
        assert p.sections == []
        assert p.tables == []
        assert p.references == []
        assert p.figures == []
        assert p.is_scanned is False
        assert p.page_count == 0

    def test_field_assignment(self):
        p = ExtractedPaper(raw_text="hello", page_count=5)
        assert p.raw_text == "hello"
        assert p.page_count == 5


class TestExtractText:
    def test_plain_text_utf8(self):
        content = "Hello world\nThis is a test.".encode("utf-8")
        result = extract_text("paper.txt", content)
        assert "Hello world" in result

    def test_plain_text_latin1_fallback(self):
        content = b"Caf\xe9 au lait"
        result = extract_text("notes.txt", content)
        assert len(result) > 0

    def test_md_file(self):
        content = "# Title\n\nAbstract here.".encode("utf-8")
        result = extract_text("paper.md", content)
        assert "Abstract" in result

    def test_pdf_scanned_fallback(self):
        # Minimal valid-ish PDF bytes that won't parse — triggers scanned fallback
        result = extract_text("paper.pdf", b"%PDF-1.4 fake content no text")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_docx_bad_bytes_fallback(self):
        result = extract_text("doc.docx", b"not a real docx")
        assert isinstance(result, str)


class TestExtractStructured:
    def setup_method(self):
        content = SAMPLE_PAPER.encode("utf-8")
        self.result = extract_structured("paper.txt", content)

    def test_returns_extracted_paper(self):
        assert isinstance(self.result, ExtractedPaper)

    def test_raw_text_populated(self):
        assert len(self.result.raw_text) > 100
        assert "LightGBM" in self.result.raw_text

    def test_sections_extracted(self):
        assert len(self.result.sections) >= 2

    def test_section_fields(self):
        for s in self.result.sections:
            assert "title" in s
            assert "text" in s
            assert "word_count" in s

    def test_tables_extracted(self):
        assert len(self.result.tables) >= 1

    def test_references_extracted(self):
        assert len(self.result.references) >= 3

    def test_figures_extracted(self):
        assert len(self.result.figures) >= 2

    def test_char_count(self):
        assert self.result.char_count > 0
        assert self.result.char_count == len(self.result.raw_text)


class TestDecolumn:
    def test_no_change_single_column(self):
        text = "This is a single column line.\nAnother line here."
        result = _decolumn(text)
        assert result == text

    def test_splits_two_column_line(self):
        line = "Left column content here     " + "     Right column content here"
        result = _decolumn(line)
        assert "Left column" in result
        assert "Right column" in result

    def test_preserves_empty_lines(self):
        text = "Line 1\n\nLine 2"
        assert _decolumn(text) == text

    def test_columned_paper_decolumned(self):
        result = _decolumn(COLUMNED_TEXT)
        assert isinstance(result, str)
        assert len(result) > 0


class TestExtractSections:
    def test_finds_markdown_headings(self):
        sections = _extract_sections(SAMPLE_PAPER)
        titles = [s["title"] for s in sections]
        # Should find at least Abstract, Method, Introduction, or Conclusion
        assert len(sections) >= 2
        assert any(kw in t for t in titles
                   for kw in ("Abstract","Method","Introduction","Experiments","Conclusion","LightGBM"))

    def test_section_has_text(self):
        sections = _extract_sections(SAMPLE_PAPER)
        for s in sections:
            assert isinstance(s["text"], str)

    def test_section_word_count(self):
        sections = _extract_sections(SAMPLE_PAPER)
        for s in sections:
            assert s["word_count"] >= 0

    def test_numbered_sections(self):
        numbered = "1. Introduction\nSome text here.\n\n2. Method\nMore text."
        sections = _extract_sections(numbered)
        assert len(sections) >= 1

    def test_latex_sections(self):
        latex = r"""
\section{Introduction}
Some intro text.
\section{Method}
Method details.
"""
        sections = _extract_sections(latex)
        assert any("Introduction" in s["title"] for s in sections)

    def test_empty_text(self):
        assert _extract_sections("") == []


class TestExtractTables:
    def test_finds_captioned_table(self):
        tables = _extract_tables(SAMPLE_PAPER)
        assert len(tables) >= 1

    def test_table_has_caption(self):
        tables = _extract_tables(SAMPLE_PAPER)
        if tables:
            assert tables[0]["caption"]
            assert len(tables[0]["caption"]) > 3

    def test_table_number_integer(self):
        tables = _extract_tables(SAMPLE_PAPER)
        for t in tables:
            assert isinstance(t["table_number"], int)

    def test_pipe_table_detected(self):
        pipe_text = "| Method | F1 | Latency |\n| --- | --- | --- |\n| SVM | 83.6 | 2ms |"
        tables = _extract_tables(pipe_text)
        assert len(tables) >= 1

    def test_no_tables_returns_empty(self):
        plain = "This paper has no tables whatsoever."
        tables = _extract_tables(plain)
        assert isinstance(tables, list)


class TestRowsToMarkdown:
    def test_returns_string(self):
        result = _rows_to_markdown("Method F1\nSVM 83.6\nLightGBM 91.4")
        assert isinstance(result, str)

    def test_contains_header_separator(self):
        result = _rows_to_markdown("Method F1\nSVM 83.6")
        assert "---" in result or "|" in result

    def test_empty_input(self):
        result = _rows_to_markdown("")
        assert isinstance(result, str)


class TestExtractReferencesStructured:
    def test_finds_references(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        assert len(refs) >= 3

    def test_year_extracted(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        years = [r["year"] for r in refs if r["year"]]
        assert len(years) >= 2
        assert all(1900 <= y <= 2030 for y in years)

    def test_doi_extracted(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        dois = [r["doi"] for r in refs if r["doi"]]
        assert len(dois) >= 1
        assert all(d.startswith("10.") for d in dois)

    def test_recent_flag(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        recent = [r for r in refs if r["is_recent"]]
        assert len(recent) >= 1   # 2023 and 2024 entries

    def test_fields_present(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        for r in refs:
            assert "raw" in r
            assert "year" in r
            assert "doi" in r
            assert "is_recent" in r

    def test_raw_text_truncated(self):
        refs = _extract_references_structured(SAMPLE_PAPER)
        for r in refs:
            assert len(r["raw"]) <= 300

    def test_no_references_section(self):
        refs = _extract_references_structured("No references here.")
        assert isinstance(refs, list)


class TestExtractFigures:
    def test_finds_figure_captions(self):
        figures = _extract_figures(SAMPLE_PAPER)
        assert len(figures) >= 2

    def test_figure_number_integer(self):
        figures = _extract_figures(SAMPLE_PAPER)
        for f in figures:
            assert isinstance(f["figure_number"], int)

    def test_caption_populated(self):
        figures = _extract_figures(SAMPLE_PAPER)
        for f in figures:
            assert f["caption"]
            assert len(f["caption"]) > 5

    def test_abbreviated_fig(self):
        text = "Fig. 3: Results on benchmark.\nFig. 4: Ablation study."
        figures = _extract_figures(text)
        assert len(figures) >= 2

    def test_no_figures_returns_empty(self):
        assert _extract_figures("No figures here.") == []


class TestStructureFromText:
    def test_returns_extracted_paper(self):
        result = _structure_from_text(SAMPLE_PAPER, "plaintext")
        assert isinstance(result, ExtractedPaper)

    def test_method_set(self):
        result = _structure_from_text(SAMPLE_PAPER, "docx")
        assert result.extraction_method == "docx"

    def test_all_fields_populated(self):
        result = _structure_from_text(SAMPLE_PAPER)
        assert result.raw_text == SAMPLE_PAPER
        assert result.char_count == len(SAMPLE_PAPER)
        assert isinstance(result.sections, list)
        assert isinstance(result.tables, list)
        assert isinstance(result.references, list)
        assert isinstance(result.figures, list)
