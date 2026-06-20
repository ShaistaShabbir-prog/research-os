"""Tests for missing routes — copilot/chat, keys, badges, health/deep."""
import os
os.environ.setdefault("DATABASE_URL","sqlite:///./test.db")
os.environ.setdefault("ANTHROPIC_API_KEY","sk-ant-demo")
os.environ.setdefault("SECRET_KEY","test-secret")
os.environ.setdefault("ADMIN_PASSWORD","test-pass")

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

DEMO_PAPER = """# Test Paper
## Abstract
We propose a method achieving 91.4% F1. Random seed: 42. Code on GitHub.
## References
1. (Smith et al., 2023)
"""

class TestHealthRoutes:
    def test_health(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health_deep(self):
        r = client.get("/api/health/deep")
        assert r.status_code == 200
        data = r.json()
        assert "checks" in data
        assert "elapsed_ms" in data
        assert data["status"] in ("healthy","degraded")

class TestCopilotChatRoute:
    def test_basic_question(self):
        r = client.post("/api/copilot/chat", json={
            "question": "What is reproducibility?",
            "history": [],
            "context": {"paper_title": "Test Paper", "reproducibility_score": 60}
        })
        assert r.status_code == 200
        data = r.json()
        assert "answer" in data
        assert "ai_powered" in data
        assert data["human_verification_required"] is True

    def test_empty_question_422(self):
        r = client.post("/api/copilot/chat", json={"question": "   ", "history": []})
        assert r.status_code == 422

    def test_suggestions_route(self):
        r = client.get("/api/copilot/suggestions")
        assert r.status_code == 200
        assert "suggestions" in r.json()

class TestApiKeyRoutes:
    def test_generate_key(self):
        r = client.post("/api/keys/generate?user_id=99&plan=free&email=test%40test.com")
        assert r.status_code == 200
        data = r.json()
        assert "api_key" in data
        assert "key_id" in data
        self.__class__.key_id = data["key_id"]
        self.__class__.api_key = data["api_key"]

    def test_list_keys(self):
        r = client.get("/api/keys?user_id=99")
        assert r.status_code == 200
        assert "keys" in r.json()

class TestBadgeRoutes:
    def test_register_badge(self):
        r = client.post("/api/badge/register", json={"document_text": DEMO_PAPER, "reviews": []})
        assert r.status_code == 200
        data = r.json()
        assert "paper_hash" in data
        assert "overall_grade" in data
        self.__class__.paper_hash = data["paper_hash"]

    def test_badge_svg(self):
        r = client.get("/api/badge/unknownhash.svg")
        assert r.status_code == 200
        assert b"<svg" in r.content

    def test_badges_list(self):
        r = client.get("/api/badges")
        assert r.status_code == 200
        assert "badges" in r.json()

    def test_score_svg(self):
        r = client.get("/api/badge/score/75.svg?label=Test")
        assert r.status_code == 200
        assert b"<svg" in r.content

class TestAuthRoutes:
    def test_register(self):
        r = client.post("/api/auth/register", json={
            "email": "testroute@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        })
        assert r.status_code in (200, 422)  # 422 if already exists
        if r.status_code == 200:
            assert "token" in r.json()
            self.__class__.token = r.json()["token"]

    def test_login(self):
        client.post("/api/auth/register", json={
            "email": "logintest2@example.com","password": "loginpass1","full_name":"L"})
        r = client.post("/api/auth/login", json={
            "email": "logintest2@example.com","password": "loginpass1"})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_wrong_password(self):
        r = client.post("/api/auth/login", json={
            "email": "logintest2@example.com","password": "wrongpass9"})
        assert r.status_code == 401
