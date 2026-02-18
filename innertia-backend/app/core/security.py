"""
Security configurations including CORS, rate limiting, and security headers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time

from app.core.config import settings


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Custom rate limiting middleware."""
    
    async def dispatch(self, request: Request, call_next):
        # Apply rate limiting
        if limiter.limit(str(settings.RATE_LIMIT_PER_MINUTE) + "/minute")(request):
            response = await call_next(request)
            return response
        return Response(
            content='{"detail": "Rate limit exceeded"}',
            status_code=429,
            media_type="application/json"
        )


def setup_cors(app: FastAPI) -> None:
    """Configure CORS middleware."""
    # For development, allow all origins. In production, use settings.CORS_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all for development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def setup_rate_limiting(app: FastAPI) -> None:
    """Configure rate limiting middleware."""
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response


def setup_security_headers(app: FastAPI) -> None:
    """Configure security headers middleware."""
    app.add_middleware(SecurityHeadersMiddleware)
