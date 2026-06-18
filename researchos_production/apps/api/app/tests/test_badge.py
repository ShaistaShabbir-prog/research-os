"""Tests for Issue #16: Reproducibility Badge System."""
import pytest, re
from app.services.badge_service import (
    BadgeData, _grade, _grade_color, _score_color,
    paper_hash, register_badge, get_badge, list_badges,
    generate_badge_svg, generate_score_svg, badge_report, _svg_not_found,
)

PAPER = """# Chatter Detection
## Abstract
We propose LightGBM for chatter detection at 91.4% F1. Random seed: 42. Code on GitHub.
## Method
LightGBM learning rate 0.05, 300 estimators, random_state=42.
## Experiments
Table 1 shows results. Baseline SVM achieves 83.6%. p < 0.05.
## References
1. (Smith et al., 2023)
"""

class TestGrade:
    def test_a_grade(self): assert _grade(92) == "A"
    def test_b_grade(self): assert _grade(80) == "B"
    def test_c_grade(self): assert _grade(65) == "C"
    def test_d_grade(self): assert _grade(50) == "D"
    def test_f_grade(self): assert _grade(30) == "F"
    def test_boundary_90(self): assert _grade(90) == "A"
    def test_boundary_75(self): assert _grade(75) == "B"

class TestColors:
    def test_grade_colors_are_hex(self):
        for g in "ABCDF":
            c = _grade_color(g)
            assert c.startswith("#") and len(c) == 7
    def test_score_green(self): assert _grade_color("A") == "#22c55e"
    def test_score_red(self):   assert _grade_color("F") == "#ef4444"
    def test_score_color_high(self):
        assert _score_color(80).startswith("#22")
    def test_score_color_low(self):
        assert _score_color(30).startswith("#ef")

class TestPaperHash:
    def test_returns_12_chars(self):
        h = paper_hash("My Paper", "abstract")
        assert len(h) == 12
    def test_deterministic(self):
        assert paper_hash("title","abs") == paper_hash("title","abs")
    def test_different_titles_differ(self):
        assert paper_hash("Paper A") != paper_hash("Paper B")
    def test_hex_chars_only(self):
        h = paper_hash("test")
        assert re.fullmatch(r"[0-9a-f]+", h)

class TestRegisterBadge:
    def setup_method(self):
        self.data = register_badge(PAPER)

    def test_returns_dict(self):
        assert isinstance(self.data, dict)

    def test_required_fields(self):
        for k in ["paper_hash","title","reproducibility_score","items_passed",
                  "items_total","overall_grade","embed_markdown","embed_svg_url"]:
            assert k in self.data, f"Missing: {k}"

    def test_score_bounded(self):
        assert 0 <= self.data["reproducibility_score"] <= 100

    def test_items_consistent(self):
        assert self.data["items_passed"] <= self.data["items_total"]

    def test_grade_valid(self):
        assert self.data["overall_grade"] in "ABCDF"

    def test_embed_markdown_format(self):
        md = self.data["embed_markdown"]
        assert md.startswith("![") and "researchos.app" in md

    def test_embed_svg_url(self):
        url = self.data["embed_svg_url"]
        assert url.startswith("/api/badge/") and url.endswith(".svg")

    def test_checklist_present(self):
        assert isinstance(self.data.get("checklist"), dict)
        assert len(self.data["checklist"]) >= 5

    def test_human_verification_required(self):
        assert self.data["human_verification_required"] is True

    def test_badge_retrievable(self):
        h = self.data["paper_hash"]
        retrieved = get_badge(h)
        assert retrieved is not None
        assert retrieved["paper_hash"] == h

class TestGetBadge:
    def test_returns_none_for_unknown(self):
        assert get_badge("nonexistent123") is None

    def test_returns_data_after_register(self):
        data = register_badge(PAPER)
        assert get_badge(data["paper_hash"]) is not None

class TestListBadges:
    def test_returns_list(self):
        assert isinstance(list_badges(), list)

    def test_contains_registered(self):
        data = register_badge(PAPER)
        hashes = [b["paper_hash"] for b in list_badges()]
        assert data["paper_hash"] in hashes

class TestGenerateBadgeSvg:
    def setup_method(self):
        self.data = register_badge(PAPER)
        self.h = self.data["paper_hash"]

    def test_returns_svg_string(self):
        svg = generate_badge_svg(self.h)
        assert svg.startswith("<svg")
        assert "</svg>" in svg

    def test_contains_grade(self):
        svg = generate_badge_svg(self.h)
        assert self.data["overall_grade"] in svg

    def test_flat_square_style(self):
        svg = generate_badge_svg(self.h, style="flat-square")
        assert "<svg" in svg

    def test_for_the_badge_style(self):
        svg = generate_badge_svg(self.h, style="for-the-badge")
        assert "<svg" in svg

    def test_not_found_svg(self):
        svg = generate_badge_svg("doesnotexist")
        assert "not found" in svg.lower()

class TestGenerateScoreSvg:
    def test_returns_svg(self):
        svg = generate_score_svg(80)
        assert svg.startswith("<svg")

    def test_score_in_svg(self):
        svg = generate_score_svg(75, "Repro")
        assert "75%" in svg or "75" in svg

    def test_zero_score(self):
        svg = generate_score_svg(0)
        assert "<svg" in svg

    def test_perfect_score(self):
        svg = generate_score_svg(100)
        assert "<svg" in svg

class TestBadgeReport:
    def setup_method(self):
        self.data = register_badge(PAPER)
        self.h = self.data["paper_hash"]
        self.report = badge_report(self.h)

    def test_returns_string(self):
        assert isinstance(self.report, str)

    def test_contains_title(self):
        assert "Chatter" in self.report

    def test_contains_score(self):
        score = str(self.data["reproducibility_score"])
        assert score in self.report

    def test_contains_checklist(self):
        assert "✅" in self.report or "❌" in self.report

    def test_contains_embed(self):
        assert "```markdown" in self.report

    def test_not_found(self):
        result = badge_report("unknown")
        assert "not found" in result.lower()
