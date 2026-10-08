from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.persistence.database import get_db
from app.persistence.models.entities import User
from app.api.v1.schemas.auth import (
    UserResponse, CreateUserRequest, ResetPasswordRequest, 
    ResetPasswordResponse, UpdateUserRequest
)
from app.api.v1.routes.auth import get_current_user
from app.core.security import (
    hash_password, validate_password_complexity, generate_secure_random_password
)

router = APIRouter(prefix="/users", tags=["User Management (Admin Only)"])

def require_admin(user: User = Depends(get_current_user)) -> User:
    """Zero Client Trust: Strictly enforce Admin (L3) role for any user management action."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permiso denegado: Solo el Administrador (L3) tiene acceso a la gestión y directorio de usuarios."
        )
    return user


@router.get("", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lista todos los operadores, técnicos y administradores registrados en la plataforma."""
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=ResetPasswordResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Crea un nuevo usuario (Operador, Técnico o Administrador) con contraseña segura."""
    email_clean = payload.email.lower().strip()
    if "@" not in email_clean or "." not in email_clean.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de correo electrónico inválido."
        )
    existing = (await db.execute(select(User).where(User.email == email_clean))).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una cuenta registrada con el correo {email_clean}."
        )

    valid_roles = ["operator", "technician", "admin"]
    if payload.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Roles permitidos: {', '.join(valid_roles)}."
        )

    # Determine password
    if payload.password:
        try:
            validate_password_complexity(payload.password)
            plain_pwd = payload.password
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    else:
        plain_pwd = generate_secure_random_password()

    new_user = User(
        email=email_clean,
        hashed_password=hash_password(plain_pwd),
        full_name=payload.full_name.strip(),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return ResetPasswordResponse(
        message=f"Usuario {new_user.full_name} creado exitosamente con rol {new_user.role}.",
        temporary_password=plain_pwd,
        user=new_user
    )


@router.patch("/{user_id}/password", response_model=ResetPasswordResponse)
async def reset_user_password(
    user_id: str,
    payload: ResetPasswordRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Restablece la contraseña de cualquier usuario o genera una credencial temporal segura."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if payload.new_password:
        try:
            validate_password_complexity(payload.new_password)
            plain_pwd = payload.new_password
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    else:
        plain_pwd = generate_secure_random_password()

    user.hashed_password = hash_password(plain_pwd)
    await db.commit()
    await db.refresh(user)

    return ResetPasswordResponse(
        message=f"Contraseña actualizada para {user.full_name} ({user.email}).",
        temporary_password=plain_pwd,
        user=user
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Actualiza datos del usuario (Nombre, Rol, Estado activo/inactivo)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.role is not None:
        valid_roles = ["operator", "technician", "admin"]
        if payload.role not in valid_roles:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido.")
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    await db.commit()
    await db.refresh(user)
    return user
