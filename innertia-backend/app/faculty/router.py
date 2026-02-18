"""
Faculty routes.
Handles class management, session control, and student sync status.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.accounts.dependencies import require_faculty_or_admin, get_current_active_user
from app.models.models import User
from app.models.models import Class, Session as SessionModel, Enrollment, SlideState
from app.faculty.schemas import (
    ClassOut, ClassWithEnrollment, SessionStart, SessionOut,
    SlideLockToggle, SlideStateOut, StudentSyncStatus, StudentSyncList,
    FacultyDashboard
)

router = APIRouter(prefix="/faculty", tags=["Faculty"])


# ============ Class Management Endpoints ============

@router.get(
    "/classes",
    response_model=list[ClassWithEnrollment],
    dependencies=[Depends(require_faculty_or_admin)]
)
async def get_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all classes assigned to the faculty member.
    """
    # Get classes taught by this faculty
    query = (
        select(Class, func.count(Enrollment.id).label("enrollment_count"))
        .outerjoin(Enrollment, Class.id == Enrollment.class_id)
        .where(Class.faculty_id == current_user.id)
        .group_by(Class.id)
        .order_by(Class.created_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    classes = []
    for row in rows:
        class_obj, enrollment_count = row
        classes.append(
            ClassWithEnrollment(
                id=str(class_obj.id),
                name=class_obj.name,
                description=class_obj.description,
                is_active=class_obj.is_active,
                enrollment_count=enrollment_count,
                created_at=class_obj.created_at
            )
        )
    
    return classes


@router.get(
    "/classes/{class_id}",
    response_model=ClassOut,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def get_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific class by ID.
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    result = await db.execute(
        select(Class).where(
            and_(Class.id == class_uuid, Class.faculty_id == current_user.id)
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or not authorized"
        )
    
    return ClassOut(
        id=str(class_obj.id),
        name=class_obj.name,
        description=class_obj.description,
        faculty_id=str(class_obj.faculty_id),
        is_active=class_obj.is_active,
        created_at=class_obj.created_at,
        updated_at=class_obj.updated_at
    )


# ============ Session Control Endpoints ============

@router.post(
    "/sessions/start",
    response_model=SessionOut,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def start_session(
    session_data: SessionStart,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Start a new session for a class.
    """
    try:
        class_uuid = uuid.UUID(session_data.class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Verify class belongs to faculty
    result = await db.execute(
        select(Class).where(
            and_(Class.id == class_uuid, Class.faculty_id == current_user.id)
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or not authorized"
        )
    
    # Check for active session
    active_result = await db.execute(
        select(SessionModel).where(
            and_(
                SessionModel.class_id == class_uuid,
                SessionModel.is_active == True
            )
        )
    )
    active_session = active_result.scalar_one_or_none()
    
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active session already exists for this class"
        )
    
    # Create new session
    new_session = SessionModel(
        class_id=class_uuid,
        started_at=datetime.utcnow(),
        is_active=True
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    # Create initial slide state
    slide_state = SlideState(
        session_id=new_session.id,
        current_slide=0,
        is_locked=False
    )
    db.add(slide_state)
    await db.commit()
    
    return SessionOut(
        id=str(new_session.id),
        class_id=str(new_session.class_id),
        started_at=new_session.started_at,
        ended_at=new_session.ended_at,
        is_active=new_session.is_active,
        created_at=new_session.created_at
    )


@router.post(
    "/sessions/{session_id}/end",
    response_model=SessionOut,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    End an active session.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify session belongs to faculty's class
    result = await db.execute(
        select(SessionModel).where(
            and_(
                SessionModel.id == session_uuid,
                SessionModel.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not authorized"
        )
    
    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    # End session
    session.is_active = False
    session.ended_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(session)
    
    return SessionOut(
        id=str(session.id),
        class_id=str(session.class_id),
        started_at=session.started_at,
        ended_at=session.ended_at,
        is_active=session.is_active,
        created_at=session.created_at
    )


@router.get(
    "/sessions/active",
    response_model=Optional[SessionOut],
    dependencies=[Depends(require_faculty_or_admin)]
)
async def get_active_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the currently active session for the faculty.
    """
    # Get active session for faculty's classes
    result = await db.execute(
        select(SessionModel)
        .where(
            and_(
                SessionModel.is_active == True,
                SessionModel.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
        .order_by(SessionModel.started_at.desc())
        .limit(1)
    )
    
    session = result.scalar_one_or_none()
    
    if not session:
        return None
    
    return SessionOut(
        id=str(session.id),
        class_id=str(session.class_id),
        started_at=session.started_at,
        ended_at=session.ended_at,
        is_active=session.is_active,
        created_at=session.created_at
    )


# ============ Slide Lock Endpoints ============

@router.post(
    "/sessions/{session_id}/slide/lock",
    response_model=SlideStateOut,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def toggle_slide_lock(
    session_id: str,
    lock_data: SlideLockToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Toggle slide lock for a session.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify session belongs to faculty's class
    result = await db.execute(
        select(SessionModel).where(
            and_(
                SessionModel.id == session_uuid,
                SessionModel.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not authorized"
        )
    
    # Get or create slide state
    slide_result = await db.execute(
        select(SlideState).where(SlideState.session_id == session_uuid)
    )
    slide_state = slide_result.scalar_one_or_none()
    
    if not slide_state:
        slide_state = SlideState(
            session_id=session_uuid,
            current_slide=0,
            is_locked=lock_data.is_locked
        )
        db.add(slide_state)
    else:
        slide_state.is_locked = lock_data.is_locked
    
    slide_state.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(slide_state)
    
    return SlideStateOut(
        id=str(slide_state.id),
        session_id=str(slide_state.session_id),
        current_slide=slide_state.current_slide,
        is_locked=slide_state.is_locked,
        updated_at=slide_state.updated_at
    )


@router.post(
    "/sessions/{session_id}/slide/update",
    response_model=SlideStateOut,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def update_slide(
    session_id: str,
    slide_number: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the current slide number.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify session belongs to faculty's class
    result = await db.execute(
        select(SessionModel).where(
            and_(
                SessionModel.id == session_uuid,
                SessionModel.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not authorized"
        )
    
    # Get or create slide state
    slide_result = await db.execute(
        select(SlideState).where(SlideState.session_id == session_uuid)
    )
    slide_state = slide_result.scalar_one_or_none()
    
    if not slide_state:
        slide_state = SlideState(
            session_id=session_uuid,
            current_slide=slide_number,
            is_locked=False
        )
        db.add(slide_state)
    else:
        # Check if locked
        if slide_state.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Slide is locked by faculty"
            )
        slide_state.current_slide = slide_number
    
    slide_state.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(slide_state)
    
    return SlideStateOut(
        id=str(slide_state.id),
        session_id=str(slide_state.session_id),
        current_slide=slide_state.current_slide,
        is_locked=slide_state.is_locked,
        updated_at=slide_state.updated_at
    )


# ============ Student Sync Status Endpoints ============

@router.get(
    "/sessions/{session_id}/students",
    response_model=StudentSyncList,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def get_student_sync_status(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get sync status of all students in a session.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify session belongs to faculty's class
    result = await db.execute(
        select(SessionModel).where(
            and_(
                SessionModel.id == session_uuid,
                SessionModel.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not authorized"
        )
    
    # Get enrolled students
    enrollment_result = await db.execute(
        select(User, Enrollment)
        .join(Enrollment, User.id == Enrollment.user_id)
        .where(Enrollment.class_id == session.class_id)
    )
    
    students = []
    for user, enrollment in enrollment_result.all():
        students.append(
            StudentSyncStatus(
                user_id=str(user.id),
                email=user.email,
                name=user.name,
                last_sync=enrollment.enrolled_at,
                current_slide=0,  # This would come from a separate student sync tracking
                is_in_session=True
            )
        )
    
    return StudentSyncList(
        students=students,
        total=len(students)
    )


# ============ Dashboard Endpoints ============

@router.get(
    "/dashboard",
    response_model=FacultyDashboard,
    dependencies=[Depends(require_faculty_or_admin)]
)
async def get_faculty_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get faculty dashboard statistics.
    """
    # Get total classes
    class_result = await db.execute(
        select(func.count(Class.id)).where(Class.faculty_id == current_user.id)
    )
    total_classes = class_result.scalar()
    
    # Get total students
    student_result = await db.execute(
        select(func.count(Enrollment.id))
        .join(Class, Class.id == Enrollment.class_id)
        .where(Class.faculty_id == current_user.id)
    )
    total_students = student_result.scalar()
    
    # Get recent sessions
    session_result = await db.execute(
        select(SessionModel)
        .join(Class, Class.id == SessionModel.class_id)
        .where(Class.faculty_id == current_user.id)
        .order_by(SessionModel.created_at.desc())
        .limit(5)
    )
    recent_sessions = session_result.scalars().all()
    
    # Get active session
    active_result = await db.execute(
        select(SessionModel)
        .join(Class, Class.id == SessionModel.class_id)
        .where(
            and_(
                Class.faculty_id == current_user.id,
                SessionModel.is_active == True
            )
        )
        .limit(1)
    )
    active_session = active_result.scalar_one_or_none()
    
    return FacultyDashboard(
        total_classes=total_classes,
        total_students=total_students,
        recent_sessions=[
            SessionOut(
                id=str(s.id),
                class_id=str(s.class_id),
                started_at=s.started_at,
                ended_at=s.ended_at,
                is_active=s.is_active,
                created_at=s.created_at
            )
            for s in recent_sessions
        ],
        active_session=SessionOut(
            id=str(active_session.id),
            class_id=str(active_session.class_id),
            started_at=active_session.started_at,
            ended_at=active_session.ended_at,
            is_active=active_session.is_active,
            created_at=active_session.created_at
        ) if active_session else None
    )
