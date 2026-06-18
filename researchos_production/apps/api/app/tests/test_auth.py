"""Tests for Issue #10: User Auth Service."""
import pytest, os
os.environ.setdefault("SECRET_KEY","test-secret-key-for-testing")
os.environ.setdefault("DATABASE_URL","sqlite:///./test.db")

from app.services.auth_service import (
    hash_password, verify_password,
    create_token, verify_token,
    validate_email, validate_password,
)

class TestPasswordHashing:
    def test_hash_differs_from_plain(self):
        h = hash_password("mypassword1")
        assert h != "mypassword1"
    def test_verify_correct(self):
        h = hash_password("secret123")
        assert verify_password("secret123", h) is True
    def test_verify_wrong(self):
        h = hash_password("secret123")
        assert verify_password("wrong", h) is False
    def test_different_hashes(self):
        assert hash_password("pass1") != hash_password("pass1")  # salt random
    def test_format(self):
        h = hash_password("test123")
        assert ":" in h

class TestJWT:
    def test_create_and_verify(self):
        tok = create_token(1, "a@b.com")
        data = verify_token(tok)
        assert data is not None
        assert data["email"] == "a@b.com"
        assert data["sub"] == "1"
    def test_invalid_token(self):
        assert verify_token("bad.token.here") is None
    def test_tampered_token(self):
        tok = create_token(1, "a@b.com")
        parts = tok.split(".")
        parts[1] = parts[1][:-2] + "XX"
        assert verify_token(".".join(parts)) is None
    def test_token_has_3_parts(self):
        tok = create_token(42, "x@y.com")
        assert tok.count(".") == 2

class TestValidation:
    def test_valid_email(self):
        validate_email("user@example.com")  # no raise
    def test_invalid_email(self):
        with pytest.raises(ValueError): validate_email("notanemail")
    def test_valid_password(self):
        validate_password("secure123")
    def test_short_password(self):
        with pytest.raises(ValueError): validate_password("short")
    def test_no_digit(self):
        with pytest.raises(ValueError): validate_password("nodigitshere")
