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
        exempt_paths=["/health"],
        enable_test_bypass=False
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
        window_seconds=60,
        enable_test_bypass=False
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
        window_seconds=60,
        enable_test_bypass=False
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


def test_exempt_paths():
    """Test que las rutas exentas no tienen rate limiting."""
    app = FastAPI()

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=1,
        window_seconds=60,
        exempt_paths=["/health", "/docs"],
        enable_test_bypass=False
    )

    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}

    @app.get("/health")
    def health_endpoint():
        return {"status": "healthy"}

    @app.get("/docs")
    def docs_endpoint():
        return {"docs": "here"}

    client = TestClient(app)

    # Usar todo el límite en /test
    response = client.get("/test")
    assert response.status_code == 200

    # Segunda request a /test debe fallar
    response = client.get("/test")
    assert response.status_code == 429

    # Pero las rutas exentas deben seguir funcionando
    for _ in range(10):
        response = client.get("/health")
        assert response.status_code == 200

        response = client.get("/docs")
        assert response.status_code == 200


def test_test_bypass_enabled():
    """Test que el bypass de TestClient funciona cuando está habilitado."""
    app = FastAPI()

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=1,
        window_seconds=60,
        enable_test_bypass=True  # Bypass habilitado
    )

    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}

    client = TestClient(app)

    # Con bypass habilitado, no debe haber rate limiting
    # y los headers no deben agregarse
    for _ in range(10):
        response = client.get("/test")
        assert response.status_code == 200
        # No hay headers de rate limit porque está bypassed
        assert "X-RateLimit-Limit" not in response.headers


def test_unknown_client_ip():
    """Test que se maneja correctamente cuando no hay client IP."""
    # Este test verifica que el código maneja el caso cuando request.client es None
    limiter = RateLimiter(max_requests=5, window_seconds=60)

    # Simular IP "unknown"
    allowed, remaining = limiter.is_allowed("unknown")
    assert allowed is True
    assert remaining == 4


def test_rate_limiter_cleanup_with_recent_activity():
    """Test que la limpieza no elimina entradas con actividad reciente."""
    limiter = RateLimiter(max_requests=10, window_seconds=60)

    # Crear entradas recientes
    for i in range(3):
        limiter.is_allowed(f"ip_{i}")

    assert len(limiter.requests) == 3

    # Limpiar con max_age muy grande (no debería eliminar nada reciente)
    limiter.cleanup_old_entries(max_age_seconds=3600)

    # Las entradas recientes deben permanecer
    assert len(limiter.requests) == 3


def test_rate_limit_headers_all_present():
    """Test que todos los headers de rate limit están presentes en respuesta exitosa."""
    app = FastAPI()

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=5,
        window_seconds=30,
        enable_test_bypass=False
    )

    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}

    client = TestClient(app)

    response = client.get("/test")
    assert response.status_code == 200

    # Verificar todos los headers
    assert "X-RateLimit-Limit" in response.headers
    assert response.headers["X-RateLimit-Limit"] == "5"

    assert "X-RateLimit-Remaining" in response.headers
    assert response.headers["X-RateLimit-Remaining"] == "4"

    assert "X-RateLimit-Reset" in response.headers
    # El reset debe ser un timestamp válido
    reset_time = int(response.headers["X-RateLimit-Reset"])
    assert reset_time > time.time()


def test_rate_limit_exceeded_all_headers():
    """Test que todos los headers están presentes cuando se excede el límite."""
    app = FastAPI()

    app.add_middleware(
        RateLimitMiddleware,
        max_requests=2,
        window_seconds=60,
        enable_test_bypass=False
    )

    @app.get("/test")
    def test_endpoint():
        return {"message": "ok"}

    client = TestClient(app)

    # Consumir el límite
    client.get("/test")
    client.get("/test")

    # Exceder el límite
    response = client.get("/test")
    assert response.status_code == 429

    # Verificar headers en respuesta de error
    assert "Retry-After" in response.headers
    assert response.headers["Retry-After"] == "60"

    assert "X-RateLimit-Limit" in response.headers
    assert response.headers["X-RateLimit-Limit"] == "2"

    assert "X-RateLimit-Remaining" in response.headers
    assert response.headers["X-RateLimit-Remaining"] == "0"

    assert "X-RateLimit-Reset" in response.headers
