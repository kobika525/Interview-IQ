import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from pwdlib import PasswordHash

from app.config import settings

password_hasher = PasswordHash.recommended()  # Argon2 under the hood


def hash_password(plain_password: str) -> str:
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(plain_password, password_hash)
    except Exception:
        return False


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "type": "access", "exp": expire, "iat": datetime.now(timezone.utc)}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token_value() -> str:
    """Returns a high-entropy opaque token. Only its hash is ever stored."""
    return secrets.token_urlsafe(48)


def hash_token(raw_token: str) -> str:
    """One-way hash for refresh/reset/verification tokens stored in the DB."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
    if payload.get("type") != "access":
        raise ValueError("Wrong token type")
    return payload


def generate_numeric_otp(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))
