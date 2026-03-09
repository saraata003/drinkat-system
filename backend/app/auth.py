import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app import models

# ===== JWT Settings =====
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "720"))

# ✅ مهم: بدون bcrypt عشان ما يعلق على Python 3.14
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

bearer = HTTPBearer(auto_error=False)


def hash_pin(pin: str) -> str:
    # PIN 4 أرقام — بس بنخزنه hash
    return pwd_context.hash(pin)


def verify_pin(pin: str, pin_hash: str) -> bool:
    return pwd_context.verify(pin, pin_hash)


def create_access_token(staff_id: int, staff_name: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {
        "sub": str(staff_id),
        "name": staff_name,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def require_staff(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token")

    staff_id = decode_token(creds.credentials)

    staff = (
        db.query(models.Staff)
        .filter(models.Staff.id == staff_id, models.Staff.is_active == True)
        .first()
    )
    if not staff:
        raise HTTPException(status_code=401, detail="Staff not found or inactive")

    return {"id": staff.id, "name": staff.name}