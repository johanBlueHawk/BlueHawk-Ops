from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.persistence.database import engine, Base, AsyncSessionLocal
from app.api.v1.routes.operations import router as ops_router
from app.api.v1.routes.auth import router as auth_router, seed_initial_users
from app.api.v1.routes.users import router as users_router

# Lifespan event to create tables and seed users on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed initial demo users (Admin, Técnico, Operador)
    async with AsyncSessionLocal() as session:
        await seed_initial_users(session)
    yield
    # Cleanup if needed
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centro Unificado de Operaciones, Redes e Infraestructura para Blue Hawk Technologies",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    lifespan=lifespan
)

# CORS Middleware (Strict per SECURITY_GENERAL / BLUE_HAWK_SECURITY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware (per SECURITY_GENERAL.md 7.1)
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Server"] = "BlueHawk-NOC"
    return response

# Register API v1 Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(ops_router, prefix=settings.API_V1_PREFIX, tags=["Operations & Integrations"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Blue Hawk Ops Core API",
        "version": settings.VERSION
    }
