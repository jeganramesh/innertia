"""
Faculty router.
Handles operations for faculty members.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.models.models import User, Class, Session as SessionModel, Enrollment, AINote
from app.shared.permissions import require_roles, verify_ownership
from app.accounts.dependencies import get_current_user


router = APIRouter(
    prefix="/faculty",
    tags=["Faculty"]
)


# =============================================================================
# FACULTY DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def faculty_dashboard(
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get faculty dashboard data."""
    # Get classes taught by this faculty
    classes_result = await db.execute(
        select(Class).where(
            Class.faculty_id == current_user.id,
            Class.college_id == current_user.college_id,
            Class.is_archived == False
        )
    )
    classes = classes_result.scalars().all()
    
    # Get total students
    total_students = 0
    class_ids = [c.id for c in classes]
    if class_ids:
        students_result = await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.class_id.in_(class_ids)
            )
        )
        total_students = students_result.scalar()
    
    # Get recent sessions
    sessions_result = await db.execute(
        select(SessionModel).where(
            SessionModel.faculty_id == current_user.id
        ).order_by(SessionModel.created_at.desc()).limit(5)
    )
    recent_sessions = sessions_result.scalars().all()
    
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
            "classes": len(classes),
            "students": total_students,
            "active_sessions": active_sessions,
        },
        "recent_sessions": [
            {
                "id": str(s.id),
                "class_id": str(s.class_id),
                "is_active": s.is_active,
                "created_at": s.created_at.isoformat()
            }
            for s in recent_sessions
        ]
    }


# =============================================================================
# CLASSES (FACULTY VIEW)
# =============================================================================

@router.get("/classes")
async def list_my_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """List classes taught by this faculty."""
    query = select(Class).where(
        Class.faculty_id == current_user.id,
        Class.college_id == current_user.college_id,
        Class.is_archived == False
    )
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Class.name)
    result = await db.execute(query)
    classes = result.scalars().all()
    
    items = []
    for c in classes:
        # Get enrollment count
        enroll_result = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.class_id == c.id)
        )
        enroll_count = enroll_result.scalar()
        
        items.append({
            "id": str(c.id),
            "name": c.name,
            "department": c.department,
            "academic_year": c.academic_year,
            "student_count": enroll_count
        })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/classes/{class_id}")
async def get_class_details(
    class_id: UUID,
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific class."""
    result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.faculty_id == current_user.id,
            Class.college_id == current_user.college_id
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or not taught by you"
        )
    
    # Get enrollment count
    enroll_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.class_id == class_id)
    )
    enroll_count = enroll_result.scalar()
    
    # Get recent sessions
    sessions_result = await db.execute(
        select(SessionModel).where(
            SessionModel.class_id == class_id
        ).order_by(SessionModel.created_at.desc()).limit(10)
    )
    sessions = sessions_result.scalars().all()
    
    return {
        "id": str(class_obj.id),
        "name": class_obj.name,
        "department": class_obj.department,
        "academic_year": class_obj.academic_year,
        "student_count": enroll_count,
        "sessions": [
            {
                "id": str(s.id),
                "is_active": s.is_active,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "created_at": s.created_at.isoformat()
            }
            for s in sessions
        ]
    }


# =============================================================================
# SESSIONS (FACULTY)
# =============================================================================

@router.post("/sessions")
async def create_session(
    class_id: UUID,
    title: Optional[str] = None,
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new session for a class."""
    # Verify class belongs to faculty
    class_result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.faculty_id == current_user.id,
            Class.college_id == current_user.college_id
        )
    )
    if not class_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or not taught by you"
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


@router.get("/sessions")
async def list_my_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    class_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """List sessions for this faculty."""
    query = select(SessionModel).where(
        SessionModel.faculty_id == current_user.id,
        SessionModel.college_id == current_user.college_id
    )
    
    if class_id:
        query = query.where(SessionModel.class_id == class_id)
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
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "created_at": s.created_at.isoformat()
            }
            for s in sessions
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.post("/sessions/{session_id}/start")
async def start_session(
    session_id: UUID,
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """Start a session."""
    result = await db.execute(
        select(SessionModel).where(
            SessionModel.id == session_id,
            SessionModel.faculty_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.is_active = True
    session.start_time = datetime.utcnow()
    await db.commit()
    
    return {
        "id": str(session.id),
        "is_active": session.is_active,
        "start_time": session.start_time.isoformat()
    }


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: UUID,
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """End a session."""
    result = await db.execute(
        select(SessionModel).where(
            SessionModel.id == session_id,
            SessionModel.faculty_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.is_active = False
    session.end_time = datetime.utcnow()
    await db.commit()
    
    return {
        "id": str(session.id),
        "is_active": session.is_active,
        "end_time": session.end_time.isoformat()
    }


# =============================================================================
# ENROLLMENTS (FACULTY)
# =============================================================================

@router.get("/classes/{class_id}/enrollments")
async def list_enrollments(
    class_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("faculty")),
    db: AsyncSession = Depends(get_db)
):
    """List enrollments for a class."""
    # Verify class belongs to faculty
    class_result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.faculty_id == current_user.id
        )
    )
    if not class_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    query = select(Enrollment).where(Enrollment.class_id == class_id)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    query = query.offset(skip).limit(limit).order_by(Enrollment.enrolled_at.desc())
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    items = []
    for e in enrollments:
        student_result = await db.execute(
            select(User).where(User.id == e.student_id)
        )
        student = student_result.scalar_one_or_none()
        if student:
            items.append({
                "id": str(e.id),
                "student_id": str(e.student_id),
                "student_name": student.full_name,
                "student_email": student.email,
                "enrolled_at": e.enrolled_at.isoformat()
            })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }
