"""Issue #14: API Key management for public API access."""
from __future__ import annotations
import hashlib, os, secrets, time
from typing import Any

_KEY_STORE: dict[str, dict] = {}  # production: use DB

def generate_api_key(user_id: int, email: str, plan: str = "free") -> dict[str, Any]:
    raw   = secrets.token_urlsafe(32)
    hashed= hashlib.sha256(raw.encode()).hexdigest()
    key_id= f"ros_{raw[:8]}"
    _KEY_STORE[hashed] = {
        "key_id":    key_id,
        "user_id":   user_id,
        "email":     email,
        "plan":      plan,
        "created_at":time.time(),
        "calls_today":0,
        "calls_limit":{"free":10,"pro":10000,"team":100000}.get(plan,10),
        "last_reset": time.strftime("%Y-%m-%d"),
    }
    return {"api_key":raw,"key_id":key_id,"plan":plan,
            "calls_limit":_KEY_STORE[hashed]["calls_limit"],
            "warning":"Store this key securely — it will not be shown again."}

def verify_api_key(raw_key: str) -> dict[str, Any] | None:
    if not raw_key: return None
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    data   = _KEY_STORE.get(hashed)
    if not data: return None
    today = time.strftime("%Y-%m-%d")
    if data["last_reset"] != today:
        data["calls_today"] = 0
        data["last_reset"]  = today
    if data["calls_today"] >= data["calls_limit"]: return None
    data["calls_today"] += 1
    return data

def list_keys(user_id: int) -> list[dict]:
    return [
        {"key_id":v["key_id"],"plan":v["plan"],"calls_today":v["calls_today"],
         "calls_limit":v["calls_limit"],"email":v["email"]}
        for v in _KEY_STORE.values() if v["user_id"]==user_id
    ]

def revoke_key(key_id: str, user_id: int) -> bool:
    for h, v in list(_KEY_STORE.items()):
        if v["key_id"]==key_id and v["user_id"]==user_id:
            del _KEY_STORE[h]; return True
    return False
