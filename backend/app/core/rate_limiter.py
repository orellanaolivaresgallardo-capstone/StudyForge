"""
Rate Limiter Middleware - Control de límites de tasa para la API.
Implementación basada en IP con ventanas deslizantes en memoria.
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, List
from datetime import datetime, timedelta
from collections import deque
import time
from app.core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """
    Rate limiter basado en ventanas deslizantes.
    Almacena timestamps de requests por IP.
    """
    
    def __init__(self, max_requests: int, window_seconds: int):
        """
        Inicializa el rate limiter.
        
        Args:
            max_requests: Número máximo de requests permitidos
            window_seconds: Ventana de tiempo en segundos
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = {}
        
    def is_allowed(self, identifier: str) -> tuple[bool, int]:
        """
        Verifica si una request está permitida.
        
        Args:
            identifier: Identificador único (normalmente IP)
            
        Returns:
            Tupla (permitido, remaining_requests)
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        # Inicializar cola si no existe
        if identifier not in self.requests:
            self.requests[identifier] = deque()
        
        # Limpiar requests antiguas
        request_times = self.requests[identifier]
        while request_times and request_times[0] < window_start:
            request_times.popleft()
        
        # Verificar límite
        if len(request_times) >= self.max_requests:
            remaining = 0
            return False, remaining
        
        # Registrar nueva request
        request_times.append(now)
        remaining = self.max_requests - len(request_times)
        
        return True, remaining
    
    def cleanup_old_entries(self, max_age_seconds: int = 3600):
        """
        Limpia entradas antiguas para liberar memoria.
        
        Args:
            max_age_seconds: Edad máxima de entradas en segundos
        """
        now = time.time()
        cutoff = now - max_age_seconds
        
        # Eliminar IPs sin actividad reciente
        to_remove = []
        for identifier, request_times in self.requests.items():
            if not request_times or request_times[-1] < cutoff:
                to_remove.append(identifier)
        
        for identifier in to_remove:
            del self.requests[identifier]
            
        if to_remove:
            logger.debug(f"Cleaned up {len(to_remove)} inactive rate limit entries")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware de FastAPI para aplicar rate limiting.
    """
    
    def __init__(
        self,
        app,
        max_requests: int = 100,
        window_seconds: int = 60,
        exempt_paths: List[str] = None # type: ignore
    ):
        """
        Inicializa el middleware.
        
        Args:
            app: Aplicación FastAPI
            max_requests: Número máximo de requests por ventana
            window_seconds: Duración de la ventana en segundos
            exempt_paths: Rutas exentas de rate limiting
        """
        super().__init__(app)
        self.rate_limiter = RateLimiter(max_requests, window_seconds)
        self.exempt_paths = exempt_paths or ["/health", "/docs", "/redoc", "/openapi.json"]
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        
        logger.info(
            f"Rate limiter initialized: {max_requests} requests per {window_seconds}s"
        )
    
    async def dispatch(self, request: Request, call_next):
        """
        Procesa cada request aplicando rate limiting.
        
        Args:
            request: Request de FastAPI
            call_next: Siguiente middleware/handler
            
        Returns:
            Response
        """
        # Verificar si la ruta está exenta
        if any(request.url.path.startswith(path) for path in self.exempt_paths):
            return await call_next(request)
        
        # Obtener identificador (IP del cliente)
        client_ip = request.client.host if request.client else "unknown"
        
        # Verificar límite
        allowed, remaining = self.rate_limiter.is_allowed(client_ip)
        
        if not allowed:
            logger.warning(
                f"Rate limit exceeded for IP {client_ip} on {request.url.path}"
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "error_code": "RATE_LIMIT_EXCEEDED"
                },
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + self.window_seconds)
                }
            )
        
        # Procesar request normalmente
        response = await call_next(request)
        
        # Agregar headers informativos
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(
            int(time.time()) + self.window_seconds
        )
        
        return response
