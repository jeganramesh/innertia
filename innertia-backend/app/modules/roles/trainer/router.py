"""
Trainer router.
Handles operations for trainer members.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import User, Class, Session as SessionModel
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user


router = APIRouter(
    prefix="/trainer",
    tags=["Trainer"]
)


# =============================================================================
# TRAINER DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def trainer_dashboard(
    current_user: User = Depends(require_roles("trainer")),
    db: AsyncSession = Depends(get_db)
):
    """Get trainer dashboard data."""
    # Get sessions created by trainer
    sessions_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.faculty_id == current_user.id,
            SessionModel.college_id == current_user.college_id
        )
    )
    session_count = sessions_result.scalar()
    
    # Get active sessions
    active_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.faculty_id == current_user.id,
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
            "sessions": session_count,
            "active_sessions": active_sessions
        }
    }


# =============================================================================
# SESSIONS (TRAINER)
# =============================================================================

@router.get("/sessions")
async def list_my_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("trainer")),
    db: AsyncSession = Depends(get_db)
):
    """List sessions for this trainer."""
    query = select(SessionModel).where(
        SessionModel.faculty_id == current_user.id,
        SessionModel.college_id == current_user.college_id
    )
    
    if is_active is not None:
        query = query.where(SessionModel.is_active == is_active)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(SessionModel.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(s.id),
                "class_id": str(s.class_id),
                "title": s.title,
                "is_active": s.is_active,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "created_at": s.created_at.isoformat()
            }
            for s in sessions
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.post("/sessions")
async def create_session(
    class_id: UUID,
    title: Optional[str] = None,
    current_user: User = Depends(require_roles("trainer")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new session for a class."""
    # Verify class belongs to college
    class_result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.college_id == current_user.college_id
        )
    )
    if not class_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Create session
    session = SessionModel(
        class_id=class_id,
        college_id=current_user.college_id,
        faculty_id=current_user.id,
        title=title,
        is_active=False
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return {
        "id": str(session.id),
        "class_id": str(session.class_id),
        "title": session.title,
        "is_active": session.is_active,
        "created_at": session.created_at.isoformat()
    }
