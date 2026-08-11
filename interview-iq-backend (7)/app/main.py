import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.database import SessionLocal
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

configure_logging()
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("%s starting up (env=%s, ai_mode=%s)", settings.APP_NAME, settings.APP_ENV, settings.AI_MODE)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Interview IQ — AI-powered mock interview and career guidance platform API.\n\n"
        "All AI-derived scores (resume readiness, interview evaluation, career match) are "
        "**estimated and advisory only**. They do not represent certified assessments, do not "
        "infer protected characteristics, honesty, or emotional state, and should not be treated "
        "as a guarantee of any interview or hiring outcome."
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- Middleware (order matters: outermost added last) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)


# --- Exception handlers ---
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False, "message": exc.message,
            "error": {"code": exc.error_code, "details": exc.details},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    details = jsonable_encoder(exc.errors(), custom_encoder={Exception: str})
    return JSONResponse(
        status_code=422,
        content={
            "success": False, "message": "One or more fields are invalid.",
            "error": {"code": "VALIDATION_ERROR", "details": details},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False, "message": "An unexpected error occurred. Please try again.",
            "error": {"code": "INTERNAL_ERROR", "details": []},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


# --- Health endpoints (no secrets exposed) ---
@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["System"])
def api_health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get(f"{settings.API_V1_PREFIX}/ready", tags=["System"])
def ready():
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unreachable"})


# --- Routers ---
from app.api.router import api_router  # noqa: E402

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
