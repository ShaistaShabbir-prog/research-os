"""Tests for Issue #15: Conference Integration."""
import json
from app.services.conference_integration import (
    parse_openreview_json, export_hotcrp, detect_venue_format,
    _map_recommendation, _split_bullets, _hotcrp_score,
)

SAMPLE_NOTE={"id":"abc123","content":{"summary":"Good paper.","strengths":"- Clear writing
- Strong baselines","weaknesses":"- Small dataset","recommendation":"Accept (Oral)","confidence":"4: The reviewer is confident"}}

class TestOpenReview:
    def test_parse_list(self):
        r=parse_openreview_json([SAMPLE_NOTE])
        assert len(r)==1 and r[0]["summary"]=="Good paper."
    def test_parse_dict_with_notes(self):
        r=parse_openreview_json({"notes":[SAMPLE_NOTE]})
        assert len(r)==1
    def test_strengths_split(self):
        r=parse_openreview_json([SAMPLE_NOTE])
        assert isinstance(r[0]["strengths"],list)
    def test_recommendation_mapped(self):
        r=parse_openreview_json([SAMPLE_NOTE])
        assert r[0]["recommendation"] in ("accept","weak accept","strong accept")
    def test_source_set(self):
        r=parse_openreview_json([SAMPLE_NOTE])
        assert r[0]["source"]=="openreview"
    def test_invalid_raises(self):
        import pytest
        with pytest.raises(ValueError): parse_openreview_json("bad input")

class TestHotCRP:
    def test_export(self):
        reviews=[{"reviewer_id":"R1","summary":"Good","strengths":[],"weaknesses":[],"recommendation":"weak accept"}]
        out=json.loads(export_hotcrp(reviews,"42"))
        assert out["pid"]=="42" and len(out["reviews"])==1
    def test_score_mapping(self):
        assert _hotcrp_score("strong accept")==5 and _hotcrp_score("strong reject")==1

class TestDetect:
    def test_hotcrp(self): assert detect_venue_format("overall merit reviewer confidence")=="hotcrp"
    def test_openreview(self): assert detect_venue_format('"recommendation" "confidence"')=="openreview_json"
    def test_plain(self): assert detect_venue_format("some plain text review")=="plain_text"

class TestHelpers:
    def test_split_bullets(self): assert len(_split_bullets("- A
- B
- C"))==3
    def test_map_accept(self): assert _map_recommendation("accept (oral)")=="weak accept"
    def test_map_reject(self): assert _map_recommendation("reject")=="weak reject"
