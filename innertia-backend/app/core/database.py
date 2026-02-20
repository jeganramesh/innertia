"""
Database connection and session management.
Uses async SQLAlchemy for SQLite (dev) → PostgreSQL (prod).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.core.config import settings

# Import Base from models.base to avoid circular imports
from app.models.base import Base

# Import all models to register them with SQLAlchemy (after Base is defined)
# This ensures all tables are created when Base.metadata.create_all is called
from app.models.models import (
    User,
    RefreshToken,
    Class,
    Enrollment,
    Session as SessionModel,
    SlideState,
    SlideActivity,
    AINote,
    AuditLog,
    SystemSetting,
    Note,
    RoleEnum,
)

# Create async engine (SQLite doesn't need pool settings)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get async database session.
    Ensures session is properly closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()
