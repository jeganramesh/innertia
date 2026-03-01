"""
College Helper Functions
Shared utilities for college-related operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional

from app.models.models import User


async def count_college_admins(
    db: AsyncSession,
    college_id: UUID,
    exclude_user_id: Optional[UUID] = None
) -> int:
    """
    Count the number of active college admins for a given college.
    
    Args:
        db: Database session
        college_id: The college ID to check
        exclude_user_id: Optional user ID to exclude from count (for updates)
    
    Returns:
        Number of active college admins
    """
    query = select(func.count()).select_from(User).where(
        User.college_id == college_id,
        User.role == "college_admin",
        User.is_active == True,
        User.deleted_at.is_(None)
    )
    
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    
    result = await db.execute(query)
    return result.scalar() or 0


async def ensure_not_last_admin(
    db: AsyncSession,
    college_id: UUID,
    user_id: UUID,
    action: str = "remove"
) -> None:
    """
    Ensure that the user is not the last college admin.
    
    Args:
        db: Database session
        college_id: The college ID
        user_id: The user ID being modified
        action: Description of action being performed (for error message)
    
    Raises:
        ValueError: If this is the last college admin
    """
    admin_count = await count_college_admins(db, college_id, exclude_user_id=user_id)
    
    if admin_count == 0:
        raise ValueError(
            f"Cannot {action} the last college admin. "
            "Please assign another user as college admin first."
        )


async def has_college_admins(
    db: AsyncSession,
    college_id: UUID
) -> bool:
    """
    Check if a college has any active college admins.
    
    Args:
        db: Database session
        college_id: The college ID to check
    
    Returns:
        True if college has at least one active college admin
    """
    count = await count_college_admins(db, college_id)
    return count > 0


async def get_college_admin_count(
    db: AsyncSession,
    college_id: UUID
) -> int:
    """
    Get the count of active college admins for a college.
    
    Args:
        db: Database session
        college_id: The college ID to check
    
    Returns:
        Number of active college admins
    """
    return await count_college_admins(db, college_id)
