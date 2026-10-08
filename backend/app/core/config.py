from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from pathlib import Path
from typing import List, Optional, Union
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Blue Hawk Ops API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./blue_hawk_ops.db" # Default async SQLite for rapid pilot dev, Postgres in prod
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Master Key for encrypting Client Integration Secrets (AES-GCM / Fernet)
    # 32 url-safe base64-encoded bytes
    ENCRYPTION_MASTER_KEY: str = "YjRhMWYwZjdlNzY0MmY3MjBhNDM3MmE1MDk2YTFiOWM="
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("ALLOWED_ORIGINS")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.strip().startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # BlueHawk Inventory Integration
    INVENTORY_API_URL: str = "https://inventory.bluehawktech.com/api/v1"
    INVENTORY_USERNAME: Optional[str] = None
    INVENTORY_PASSWORD: Optional[str] = Field(default=None, repr=False)
    INVENTORY_API_TOKEN: Optional[str] = Field(default=None, repr=False)
    INVENTORY_DB_PATH: Optional[str] = None

    # Zammad Helpdesk & Ticketing Integration
    ZAMMAD_HTTP_URL: str = "https://support.bluehawktech.com"
    ZAMMAD_API_TOKEN: Optional[str] = Field(default=None, repr=False)
    ZAMMAD_USERNAME: Optional[str] = None
    ZAMMAD_PASSWORD: Optional[str] = Field(default=None, repr=False)
    ZAMMAD_DEFAULT_GROUP: str = "Users"
    ZAMMAD_CUSTOMER_EMAIL: str = "johan@bluehawktech.com"

    class Config:
        env_file = (".env", Path(__file__).resolve().parents[2] / ".env")
        case_sensitive = True

settings = Settings()
