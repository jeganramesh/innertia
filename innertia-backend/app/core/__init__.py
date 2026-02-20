"""Core application modules."""

from app.core.config import settings
from app.core.database import get_db, init_db, close_db
from app.core.redis import redis_client, get_redis
from app.core.security import setup_cors, setup_rate_limiting, setup_security_headers

# Import Base from models to avoid circular imports
from app.models.base import Base

__all__ = [
    "settings",
    "get_db",
    "init_db",
    "close_db",
    "Base",
    "redis_client",
    "get_redis",
    "setup_cors",
    "setup_rate_limiting",
    "setup_security_headers",
]
