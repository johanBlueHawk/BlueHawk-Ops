from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

def _get_fernet_instance() -> Fernet:
    # Ensure key is exactly 32 url-safe base64-encoded bytes
    raw_key = settings.ENCRYPTION_MASTER_KEY.encode()
    # Hash it to SHA256 and base64-encode to guarantee valid 32-byte Fernet key
    derived_key = base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest())
    return Fernet(derived_key)

def encrypt_secret(plain_text: str) -> str:
    """Encrypt sensitive API tokens / passwords before writing to DB."""
    if not plain_text:
        return ""
    f = _get_fernet_instance()
    return f.encrypt(plain_text.encode()).decode()

def decrypt_secret(cipher_text: str) -> str:
    """Decrypt sensitive API tokens / passwords in memory only (never sent to client)."""
    if not cipher_text:
        return ""
    f = _get_fernet_instance()
    return f.decrypt(cipher_text.encode()).decode()

import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

def hash_password(password: str) -> str:
    """Hashes password with bcrypt and 12 salt rounds (SECURITY_GENERAL.md 2.2)."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Validates plain password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates signed JWT token with expiration and claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default session duration (e.g. 8 hours for operational NOC shift)
        expire = datetime.now(timezone.utc) + timedelta(hours=8)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and cryptographically verifies JWT signature."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        return None
