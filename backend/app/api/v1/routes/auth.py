from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional

from app.persistence.database import get_db
from app.persistence.models.entities import User
from app.api.v1.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, hash_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])
security_bearer = HTTPBearer(auto_error=False)

# Seed Users (Idempotent, runs on startup or first request)
async def seed_initial_users(db: AsyncSession):
    complex_defaults = {
        "admin@bluehawk.tech": ("Johan_Admin#2026!SecOps", "Johan Vasquez", "admin"),
        "tecnico@bluehawk.tech": ("Carlos_Tech#2026!OpsNOC", "Carlos Gomez", "technician"),
        "operador@bluehawk.tech": ("Marcos_Op#2026!Live247", "Marcos Diaz", "operator"),
    }
    for email, (plain_pwd, name, role) in complex_defaults.items():
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                hashed_password=hash_password(plain_pwd),
                full_name=name,
                role=role,
                is_active=True
            )
            db.add(user)
        else:
            # Upgrade simple password if present
            if verify_password("BlueHawk2026!", user.hashed_password):
                user.hashed_password = hash_password(plain_pwd)
    await db.commit()

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación requerida. Token no proporcionado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado. Por favor inicie sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin identificación de usuario.")
    
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta deshabilitada.")
    
    return user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Auto-seed initial users if table is empty
    await seed_initial_users(db)

    # Opacity on failure (SECURITY_GENERAL.md 4.3): constant message
    invalid_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales incorrectas o cuenta no autorizada.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    query = select(User).where(User.email == credentials.email.lower().strip())
    user = (await db.execute(query)).scalar_one_or_none()
    if not user:
        # Dummy check against timing attacks
        verify_password("dummy", "$2b$12$dummyhashforconstanttimingdefensecheck1234567890123456")
        raise invalid_exc

    if not verify_password(credentials.password, user.hashed_password):
        raise invalid_exc

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta de usuario inactiva.")

    # Record last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    # Issue signed JWT with sub, email, and role
    token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user
