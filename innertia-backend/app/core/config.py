"""
Application configuration settings.
Loads environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Innertia Placement Shell"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://innertia:innertia123@localhost:5432/innertia_placement"
    SYNC_DATABASE_URL: str = "postgresql://innertia:innertia123@localhost:5432/innertia_placement"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
