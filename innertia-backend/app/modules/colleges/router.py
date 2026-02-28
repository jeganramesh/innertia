"""
College admin router.
Handles college-level administrative operations.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import User, College
from app.shared.permissions import require_roles, verify_college_access
from app.accounts.dependencies import get_current_user


router = APIRouter(
    prefix="/colleges",
    tags=["Colleges"]
)


# =============================================================================
# COLLEGE INFO (All authenticated users)
# =============================================================================

@router.get("/me")
async def get_my_college(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's college information."""
    if not current_user.college_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with a college"
        )
    
    result = await db.execute(
        select(College).where(College.id == current_user.college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    return {
        "id": str(college.id),
        "name": college.name,
        "code": college.code,
        "domain": college.domain,
        "is_active": college.is_active
    }


# =============================================================================
# COLLEGE ADMIN ENDPOINTS
# =============================================================================

@router.get(
    "/{college_id}/users",
    dependencies=[Depends(require_roles("college_admin"))]
)
async def list_college_users(
    college_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List users in a specific college (college admin only)."""
    # Verify college access
    await verify_college_access(current_user, college_id)
    
    from sqlalchemy import select, func
    from app.models.models import User
    
    query = select(User).where(User.college_id == college_id)
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get(
    "/{college_id}/stats",
    dependencies=[Depends(require_roles("college_admin"))]
)
async def get_college_stats(
    college_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for a college (college admin only)."""
    # Verify college access
    await verify_college_access(current_user, college_id)
    
    from sqlalchemy import select, func
    from app.models.models import Class, Session as SessionModel, Enrollment
    
    # User count by role
    user_counts = {}
    roles = ["college_admin", "staff", "faculty", "trainer", "student"]
    for role in roles:
        result = await db.execute(
            select(func.count(User.id)).where(
                User.college_id == college_id,
                User.role == role,
                User.is_active == True
            )
        )
        user_counts[role] = result.scalar()
    
    # Class count
    classes_result = await db.execute(
        select(func.count(Class.id)).where(
            Class.college_id == college_id,
            Class.is_archived == False
        )
    )
    class_count = classes_result.scalar()
    
    # Session count
    sessions_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.college_id == college_id
        )
    )
    session_count = sessions_result.scalar()
    
    # Active sessions
    active_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.college_id == college_id,
            SessionModel.is_active == True
        )
    )
    active_sessions = active_result.scalar()
    
    return {
        "college_id": str(college_id),
        "users": user_counts,
        "total_users": sum(user_counts.values()),
        "classes": class_count,
        "sessions": session_count,
        "active_sessions": active_sessions
    }


# Import select at module level
from sqlalchemy import select
