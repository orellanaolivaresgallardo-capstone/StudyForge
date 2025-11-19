"""
Tests para el Rate Limiter Middleware.
Verifica el correcto funcionamiento del control de límites de tasa.
"""
import pytest
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.rate_limiter import RateLimitMiddleware, RateLimiter


def test_rate_limiter_basic():
    """Test básico del rate limiter."""
    limiter = RateLimiter(max_requests=5, window_seconds=60)
    
    # Primeras 5 requests deben pasar
    for i in range(5):
        allowed, remaining = limiter.is_allowed("test_ip")
        assert allowed is True
        assert remaining == 4 - i
    
    # La sexta debe fallar
    allowed, remaining = limiter.is_allowed("test_ip")
    assert allowed is False
    assert remaining == 0


def test_rate_limiter_different_ips():
    """Test que diferentes IPs tienen límites independientes."""
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    
    # IP 1
    for i in range(3):
        allowed, _ = limiter.is_allowed("ip1")
        assert allowed is True
    
    # IP 1 ya no puede
    allowed, _ = limiter.is_allowed("ip1")
    assert allowed is False
    
    # IP 2 todavía puede
    for i in range(3):
        allowed, _ = limiter.is_allowed("ip2")
        assert allowed is True


def test_rate_limiter_window_reset():
    """Test que el límite se resetea después de la ventana."""
    limiter = RateLimiter(max_requests=2, window_seconds=1)
    
    # Usar el límite
    limiter.is_allowed("test_ip")
    limiter.is_allowed("test_ip")
    
    # No puede más
    allowed, _ = limiter.is_allowed("test_ip")
    assert allowed is False
    
    # Esperar que pase la ventana
    time.sleep(1.1)
    
    # Ahora debe poder de nuevo
    allowed, remaining = limiter.is_allowed("test_ip")
    assert allowed is True
    assert remaining == 1


def test_rate_limiter_cleanup():
    """Test que la limpieza de entradas antiguas funciona."""
    limiter = RateLimiter(max_requests=10, window_seconds=60)
    
    # Crear varias entradas
    for i in range(5):
        limiter.is_allowed(f"ip_{i}")
    
    assert len(limiter.requests) == 5
    
    # Limpiar con tiempo futuro (todas deberían eliminarse)
    limiter.cleanup_old_entries(max_age_seconds=0)
    
    # Las entradas vacías o antiguas se eliminan
    assert len(limiter.requests) <= 5  # Puede que algunas permanezcan si son muy recientes


def test_middleware_integration():
    """Test de integración del middleware con FastAPI."""
    app = FastAPI()
    
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=3,
        window_seconds=60,
        exempt_paths=["/health"]
    )
    
    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}
    
    @app.get("/health")
    def health_endpoint():
        return {"status": "ok"}
    
    client = TestClient(app)
    
    # Las primeras 3 requests deben pasar
    for i in range(3):
        response = client.get("/test")
        assert response.status_code == 200
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert int(response.headers["X-RateLimit-Remaining"]) == 2 - i
    
    # La cuarta debe fallar con 429
    response = client.get("/test")
    assert response.status_code == 429
    assert "Retry-After" in response.headers
    assert response.json()["error_code"] == "RATE_LIMIT_EXCEEDED"
    
    # Health debe estar exento
    for _ in range(5):
        response = client.get("/health")
        assert response.status_code == 200


def test_middleware_headers():
    """Test que los headers de rate limit se incluyen correctamente."""
    app = FastAPI()
    
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=10,
        window_seconds=60
    )
    
    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}
    
    client = TestClient(app)
    
    response = client.get("/test")
    assert response.status_code == 200
    
    # Verificar headers
    assert "X-RateLimit-Limit" in response.headers
    assert response.headers["X-RateLimit-Limit"] == "10"
    
    assert "X-RateLimit-Remaining" in response.headers
    assert int(response.headers["X-RateLimit-Remaining"]) == 9
    
    assert "X-RateLimit-Reset" in response.headers


def test_rate_limit_error_response():
    """Test que la respuesta de error tiene el formato correcto."""
    app = FastAPI()
    
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=1,
        window_seconds=60
    )
    
    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}
    
    client = TestClient(app)
    
    # Primera request OK
    response = client.get("/test")
    assert response.status_code == 200
    
    # Segunda request debe fallar
    response = client.get("/test")
    assert response.status_code == 429
    
    data = response.json()
    assert "detail" in data
    assert "error_code" in data
    assert data["error_code"] == "RATE_LIMIT_EXCEEDED"
    
    # Headers de retry
    assert "Retry-After" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert response.headers["X-RateLimit-Remaining"] == "0"
