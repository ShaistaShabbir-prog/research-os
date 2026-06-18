"""Issue #10: User Authentication Service.

JWT-based auth with email/password registration and login.
No external OAuth for now — self-contained and deployable.
"""
from __future__ import annotations

import hashlib, hmac, os, re, time
from typing import Any

# ── Config ────────────────────────────────────────────────────────────────
SECRET_KEY     = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
TOKEN_EXPIRE_S = 60 * 60 * 24 * 7   # 7 days
EMAIL_RE       = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ── Simple JWT (no external library) ─────────────────────────────────────
import base64, json as _json

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)

def _sign(header_b64: str, payload_b64: str) -> str:
    msg = f"{header_b64}.{payload_b64}".encode()
    sig = hmac.new(SECRET_KEY.encode(), msg, hashlib.sha256).digest()
    return _b64url(sig)

def create_token(user_id: int, email: str) -> str:
    header  = _b64url(_json.dumps({"alg":"HS256","typ":"JWT"}).encode())
    payload = _b64url(_json.dumps({
        "sub": str(user_id),
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRE_S,
    }).encode())
    sig = _sign(header, payload)
    return f"{header}.{payload}.{sig}"

def verify_token(token: str) -> dict[str, Any] | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        if _sign(header, payload) != sig:
            return None
        data = _json.loads(_b64url_decode(payload))
        if data.get("exp", 0) < time.time():
            return None
        return data
    except Exception:
        return None

# ── Password hashing ──────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h    = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split(":", 1)
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
        return hmac.compare_digest(h.hex(), expected)
    except Exception:
        return False

# ── Validation ────────────────────────────────────────────────────────────
def validate_email(email: str) -> None:
    if not EMAIL_RE.match(email):
        raise ValueError("Invalid email address.")

def validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")

# ── DB operations (injected session) ─────────────────────────────────────
from app.models.entities import User

def register_user(db, email: str, password: str, full_name: str = "") -> dict[str, Any]:
    validate_email(email)
    validate_password(password)
    existing = db.query(User).filter(User.email == email.lower()).first()
    if existing:
        raise ValueError("Email already registered.")
    user = User(
        email     = email.lower().strip(),
        full_name = full_name.strip() or None,
        plan      = "free",
        password_hash = hash_password(password),
    )
    db.add(user); db.commit(); db.refresh(user)
    token = create_token(user.id, user.email)
    return _user_out(user, token)

def login_user(db, email: str, password: str) -> dict[str, Any]:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not user.password_hash:
        raise ValueError("Invalid email or password.")
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password.")
    token = create_token(user.id, user.email)
    return _user_out(user, token)

def get_current_user(db, token: str) -> User | None:
    data = verify_token(token)
    if not data:
        return None
    return db.query(User).filter(User.id == int(data["sub"])).first()

def update_profile(db, user: User, full_name: str | None, plan: str | None) -> dict[str, Any]:
    if full_name is not None:
        user.full_name = full_name.strip()
    if plan and plan in ("free", "pro", "team"):
        user.plan = plan
    db.commit(); db.refresh(user)
    return _user_out(user)

def _user_out(user: User, token: str | None = None) -> dict[str, Any]:
    out: dict[str, Any] = {
        "id":         user.id,
        "email":      user.email,
        "full_name":  user.full_name,
        "plan":       user.plan,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    if token:
        out["token"]      = token
        out["token_type"] = "Bearer"
        out["expires_in"] = TOKEN_EXPIRE_S
    return out
