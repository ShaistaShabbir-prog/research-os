"""Tests for Issue #14: API Key Service."""
import os; os.environ.setdefault("SECRET_KEY","test")
from app.services.api_key_service import generate_api_key, verify_api_key, list_keys, revoke_key

class TestAPIKey:
    def test_generate(self):
        d=generate_api_key(1,"a@b.com","free")
        assert "api_key" in d and "key_id" in d and d["key_id"].startswith("ros_")
    def test_verify_valid(self):
        d=generate_api_key(2,"b@c.com","pro")
        assert verify_api_key(d["api_key"]) is not None
    def test_verify_invalid(self):
        assert verify_api_key("badkey") is None
    def test_rate_limit_free(self):
        d=generate_api_key(99,"x@y.com","free")
        for _ in range(10): verify_api_key(d["api_key"])
        assert verify_api_key(d["api_key"]) is None
    def test_list_keys(self):
        d=generate_api_key(3,"c@d.com")
        keys=list_keys(3)
        assert any(k["key_id"]==d["key_id"] for k in keys)
    def test_revoke(self):
        d=generate_api_key(4,"d@e.com")
        assert revoke_key(d["key_id"],4) is True
        assert verify_api_key(d["api_key"]) is None
