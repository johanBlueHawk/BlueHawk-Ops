from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    role: str  # "admin", "technician", "operator"
    password: Optional[str] = None  # If None, automatically generated secure password
    is_active: bool = True

class ResetPasswordRequest(BaseModel):
    new_password: Optional[str] = None  # If None, automatically generated secure password

class ResetPasswordResponse(BaseModel):
    message: str
    temporary_password: str
    user: UserResponse

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

