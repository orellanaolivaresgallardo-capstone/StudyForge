# app/main.py
"""
Aplicación principal de FastAPI - StudyForge.
Sistema de apoyo al aprendizaje con IA.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.rate_limiter import RateLimitMiddleware
from app.routers import auth, documents, summaries, quizzes, quiz_attempts, stats, study_spaces, test_sql_errors

# Inicializar logging
setup_logging()
logger = get_logger("studyforge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup logic
    logger.info(f"Starting StudyForge API v2.0.0 in {settings.ENV} mode")
    logger.info(f"Logging level: {settings.LOG_LEVEL}")
    yield
    # Shutdown logic (optional)
    logger.info("Shutting down StudyForge API")


app = FastAPI(
    title="StudyForge API",
    description="API para sistema de apoyo al aprendizaje con IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar Rate Limiting
app.add_middleware(
    RateLimitMiddleware,
    max_requests=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW,
    exempt_paths=["/health", "/docs", "/redoc", "/openapi.json"]
)


@app.get("/health", tags=["health"])
async def health_check():
    """Endpoint de salud del sistema."""
    return {
        "status": "ok",
        "service": "StudyForge API",
        "version": "2.0.0"
    }


# Incluir routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(summaries.router, prefix="/summaries", tags=["summaries"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(quiz_attempts.router, prefix="/quiz-attempts", tags=["quiz-attempts"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(study_spaces.router, prefix="/study-spaces", tags=["study-spaces"])

# Router de prueba (SOLO DESARROLLO)
if settings.DEBUG:
    app.include_router(test_sql_errors.router, tags=["test-errors"])


if __name__ == "__main__":
    import uvicorn   
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
