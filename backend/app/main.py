from fastapi import FastAPI
from app.routers.health import router as health_router

app = FastAPI()

# Montamos el router de health con prefijo y tag
app.include_router(health_router, prefix="/health", tags=["health"])
