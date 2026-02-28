"""
Student router.
Handles operations for student members.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import User, Class, Session as SessionModel, Enrollment
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user


router = APIRouter(
    prefix="/student",
    tags=["Student"]
)


# =============================================================================
# STUDENT DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def student_dashboard(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """Get student dashboard data."""
    # Get enrolled classes
    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.student_id == current_user.id)
    )
    enrollments = enrollments_result.scalars().all()
    
    class_count = len(enrollments)
    
    # Get active sessions for enrolled classes
    class_ids = [e.class_id for e in enrollments]
    active_sessions = 0
    if class_ids:
        active_result = await db.execute(
            select(func.count(SessionModel.id)).where(
                SessionModel.class_id.in_(class_ids),
                SessionModel.is_active == True
            )
        )
        active_sessions = active_result.scalar()
    
    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name
        },
        "stats": {
            "enrolled_classes": class_count,
            "active_sessions": active_sessions
        }
    }


# =============================================================================
# ENROLLMENTS (STUDENT)
# =============================================================================

@router.get("/enrollments")
async def list_my_enrollments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """List student's enrollments."""
    query = select(Enrollment).where(Enrollment.student_id == current_user.id)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Enrollment.enrolled_at.desc())
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    items = []
    for e in enrollments:
        # Get class details
        class_result = await db.execute(
            select(Class).where(Class.id == e.class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        
        if class_obj:
            items.append({
                "id": str(e.id),
                "class_id": str(e.class_id),
                "class_name": class_obj.name,
                "department": class_obj.department,
                "enrolled_at": e.enrolled_at.isoformat()
            })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


# =============================================================================
# CLASSES (STUDENT VIEW)
# =============================================================================

@router.get("/classes")
async def list_enrolled_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """List classes the student is enrolled in."""
    # Get enrollment class IDs
    enrollments_result = await db.execute(
        select(Enrollment.class_id).where(Enrollment.student_id == current_user.id)
    )
    class_ids = [r for r in enrollments_result.scalars().all()]
    
    if not class_ids:
        return {
            "items": [],
            "total": 0,
            "page": 1,
            "page_size": limit,
            "pages": 0
        }
    
    # Get classes
    query = select(Class).where(Class.id.in_(class_ids))
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    classes = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "department": c.department,
                "academic_year": c.academic_year
            }
            for c in classes
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


# =============================================================================
# SESSIONS (STUDENT VIEW)
# =============================================================================

@router.get("/sessions")
async def list_active_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db)
):
    """List active sessions for enrolled classes."""
    # Get enrolled class IDs
    enrollments_result = await db.execute(
        select(Enrollment.class_id).where(Enrollment.student_id == current_user.id)
    )
    class_ids = [r for r in enrollments_result.scalars().all()]
    
    if not class_ids:
        return {
            "items": [],
            "total": 0,
            "page": 1,
            "page_size": limit,
            "pages": 0
        }
    
    # Get active sessions
    query = select(SessionModel).where(
        SessionModel.class_id.in_(class_ids),
        SessionModel.is_active == True
    )
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    query = query.offset(skip).limit(limit).order_by(SessionModel.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    items = []
    for s in sessions:
        # Get class name
        class_result = await db.execute(
            select(Class).where(Class.id == s.class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        
        items.append({
            "id": str(s.id),
            "class_id": str(s.class_id),
            "class_name": class_obj.name if class_obj else None,
            "title": s.title,
            "is_active": s.is_active,
            "start_time": s.start_time.isoformat() if s.start_time else None
        })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }
