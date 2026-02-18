"""
Student routes.
Handles class enrollment, session joining, slide sync, and notes.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.accounts.dependencies import get_current_active_user
from app.models.models import User
from app.models.models import Class, Session as SessionModel, Enrollment, SlideState, Note
from app.student.schemas import (
    ClassOut, EnrollmentOut, SessionOut, SessionJoin,
    SlideStateOut, NoteCreate, NoteUpdate, NoteOut, NoteList,
    StudentDashboard
)

router = APIRouter(prefix="/student", tags=["Student"])


# ============ Class Enrollment Endpoints ============

@router.get(
    "/classes",
    response_model=list[ClassOut]
)
async def get_available_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all available classes for enrollment.
    """
    # Get all active classes
    result = await db.execute(
        select(Class)
        .where(Class.is_active == True)
        .order_by(Class.name)
    )
    classes = result.scalars().all()
    
    return [
        ClassOut(
            id=str(c.id),
            name=c.name,
            description=c.description,
            faculty_id=str(c.faculty_id),
            faculty_name=c.faculty.name if c.faculty else None,
            is_active=c.is_active,
            created_at=c.created_at
        )
        for c in classes
    ]


@router.get(
    "/enrollments",
    response_model=list[EnrollmentOut]
)
async def get_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all classes the student is enrolled in.
    """
    result = await db.execute(
        select(Enrollment, Class)
        .join(Class, Class.id == Enrollment.class_id)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    
    enrollments = []
    for enrollment, class_obj in result.all():
        enrollments.append(
            EnrollmentOut(
                id=str(enrollment.id),
                class_id=str(enrollment.class_id),
                class_name=class_obj.name,
                faculty_name=class_obj.faculty.name if class_obj.faculty else None,
                enrolled_at=enrollment.enrolled_at
            )
        )
    
    return enrollments


@router.post(
    "/enrollments",
    response_model=EnrollmentOut,
    status_code=status.HTTP_201_CREATED
)
async def enroll_in_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enroll in a class.
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Check if class exists and is active
    result = await db.execute(
        select(Class).where(
            and_(Class.id == class_uuid, Class.is_active == True)
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or not active"
        )
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.class_id == class_uuid
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this class"
        )
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        class_id=class_uuid
    )
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return EnrollmentOut(
        id=str(enrollment.id),
        class_id=str(enrollment.class_id),
        class_name=class_obj.name,
        faculty_name=class_obj.faculty.name if class_obj.faculty else None,
        enrolled_at=enrollment.enrolled_at
    )


@router.delete(
    "/enrollments/{class_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def unenroll_from_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Unenroll from a class.
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Find enrollment
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.class_id == class_uuid
            )
        )
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    await db.delete(enrollment)
    await db.commit()
    
    return None


# ============ Session Endpoints ============

@router.get(
    "/sessions/active",
    response_model=Optional[SessionOut]
)
async def get_active_session(
    class_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get active session for a class the student is enrolled in.
    """
    # Build query
    query = (
        select(SessionModel, Class)
        .join(Class, Class.id == SessionModel.class_id)
        .join(Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.user_id == current_user.id
        ))
        .where(SessionModel.is_active == True)
    )
    
    if class_id:
        try:
            class_uuid = uuid.UUID(class_id)
            query = query.where(SessionModel.class_id == class_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid class ID format"
            )
    
    result = await query.limit(1).all()
    
    if not result:
        return None
    
    session, class_obj = result[0]
    
    return SessionOut(
        id=str(session.id),
        class_id=str(session.class_id),
        class_name=class_obj.name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        is_active=session.is_active,
        created_at=session.created_at
    )


@router.post(
    "/sessions/join",
    response_model=SessionOut
)
async def join_session(
    join_data: SessionJoin,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Join an active session.
    """
    try:
        session_uuid = uuid.UUID(join_data.session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Get session
    result = await db.execute(
        select(SessionModel, Class)
        .join(Class, Class.id == SessionModel.class_id)
        .join(Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.user_id == current_user.id
        ))
        .where(
            and_(
                SessionModel.id == session_uuid,
                SessionModel.is_active == True
            )
        )
    )
    
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not enrolled in this class"
        )
    
    session, class_obj = row
    
    return SessionOut(
        id=str(session.id),
        class_id=str(session.class_id),
        class_name=class_obj.name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        is_active=session.is_active,
        created_at=session.created_at
    )


# ============ Slide Sync Endpoints ============

@router.get(
    "/sessions/{session_id}/slide",
    response_model=SlideStateOut
)
async def get_current_slide(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current slide state for a session.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify enrollment
    result = await db.execute(
        select(SessionModel, Class)
        .join(Class, Class.id == SessionModel.class_id)
        .join(Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.user_id == current_user.id
        ))
        .where(SessionModel.id == session_uuid)
    )
    
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not enrolled"
        )
    
    # Get slide state
    slide_result = await db.execute(
        select(SlideState).where(SlideState.session_id == session_uuid)
    )
    slide_state = slide_result.scalar_one_or_none()
    
    if not slide_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide state not found"
        )
    
    return SlideStateOut(
        id=str(slide_state.id),
        session_id=str(slide_state.session_id),
        current_slide=slide_state.current_slide,
        is_locked=slide_state.is_locked,
        updated_at=slide_state.updated_at
    )


@router.post(
    "/sessions/{session_id}/slide/sync",
    response_model=SlideStateOut
)
async def sync_slide(
    session_id: str,
    slide_number: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Sync current slide position (for tracking student progress).
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    # Verify enrollment and get session
    result = await db.execute(
        select(SessionModel, Class)
        .join(Class, Class.id == SessionModel.class_id)
        .join(Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.user_id == current_user.id
        ))
        .where(SessionModel.id == session_uuid)
    )
    
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not enrolled"
        )
    
    session, class_obj = row
    
    # Get slide state
    slide_result = await db.execute(
        select(SlideState).where(SlideState.session_id == session_uuid)
    )
    slide_state = slide_result.scalar_one_or_none()
    
    if not slide_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide state not found"
        )
    
    # If locked, still return current state but don't update
    if slide_state.is_locked:
        return SlideStateOut(
            id=str(slide_state.id),
            session_id=str(slide_state.session_id),
            current_slide=slide_state.current_slide,
            is_locked=slide_state.is_locked,
            updated_at=slide_state.updated_at
        )
    
    # Update student's synced slide (would need a separate table for per-student tracking)
    # For now, just return the current state
    
    return SlideStateOut(
        id=str(slide_state.id),
        session_id=str(slide_state.session_id),
        current_slide=slide_state.current_slide,
        is_locked=slide_state.is_locked,
        updated_at=slide_state.updated_at
    )


# ============ Notes Endpoints ============

@router.post(
    "/notes",
    response_model=NoteOut,
    status_code=status.HTTP_201_CREATED
)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Save a note for a class.
    """
    try:
        class_uuid = uuid.UUID(note_data.class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Verify enrollment
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.class_id == class_uuid
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this class"
        )
    
    # Create note
    note = Note(
        user_id=current_user.id,
        class_id=class_uuid,
        content=note_data.content,
        slide_number=note_data.slide_number
    )
    
    db.add(note)
    await db.commit()
    await db.refresh(note)
    
    return NoteOut(
        id=str(note.id),
        user_id=str(note.user_id),
        class_id=str(note.class_id),
        content=note.content,
        slide_number=note.slide_number,
        created_at=note.created_at,
        updated_at=note.updated_at
    )


@router.get(
    "/notes",
    response_model=NoteList
)
async def get_notes(
    class_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all notes for the student.
    """
    query = select(Note).where(Note.user_id == current_user.id)
    
    if class_id:
        try:
            class_uuid = uuid.UUID(class_id)
            query = query.where(Note.class_id == class_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid class ID format"
            )
    
    query = query.order_by(Note.created_at.desc())
    
    # Get total count
    count_result = await db.execute(
        select(func.count(Note.id)).where(Note.user_id == current_user.id)
    )
    total = count_result.scalar()
    
    # Execute query
    result = await db.execute(query)
    notes = result.scalars().all()
    
    return NoteList(
        notes=[
            NoteOut(
                id=str(n.id),
                user_id=str(n.user_id),
                class_id=str(n.class_id),
                content=n.content,
                slide_number=n.slide_number,
                created_at=n.created_at,
                updated_at=n.updated_at
            )
            for n in notes
        ],
        total=total
    )


@router.patch(
    "/notes/{note_id}",
    response_model=NoteOut
)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a note.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get note
    result = await db.execute(
        select(Note).where(
            and_(
                Note.id == note_uuid,
                Note.user_id == current_user.id
            )
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Update fields
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.slide_number is not None:
        note.slide_number = note_data.slide_number
    
    note.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(note)
    
    return NoteOut(
        id=str(note.id),
        user_id=str(note.user_id),
        class_id=str(note.class_id),
        content=note.content,
        slide_number=note.slide_number,
        created_at=note.created_at,
        updated_at=note.updated_at
    )


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a note.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get note
    result = await db.execute(
        select(Note).where(
            and_(
                Note.id == note_uuid,
                Note.user_id == current_user.id
            )
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    await db.delete(note)
    await db.commit()
    
    return None


# ============ Dashboard Endpoints ============

@router.get(
    "/dashboard",
    response_model=StudentDashboard
)
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get student dashboard.
    """
    # Get total enrolled classes
    class_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id)
    )
    total_classes = class_result.scalar()
    
    # Get active session
    active_result = await db.execute(
        select(SessionModel, Class)
        .join(Class, Class.id == SessionModel.class_id)
        .join(Enrollment, and_(
            Enrollment.class_id == Class.id,
            Enrollment.user_id == current_user.id
        ))
        .where(SessionModel.is_active == True)
        .limit(1)
    )
    active_row = active_result.one_or_none()
    
    active_session = None
    if active_row:
        session, class_obj = active_row
        active_session = SessionOut(
            id=str(session.id),
            class_id=str(session.class_id),
            class_name=class_obj.name,
            started_at=session.started_at,
            ended_at=session.ended_at,
            is_active=session.is_active,
            created_at=session.created_at
        )
    
    # Get recent notes
    notes_result = await db.execute(
        select(Note)
        .where(Note.user_id == current_user.id)
        .order_by(Note.created_at.desc())
        .limit(5)
    )
    recent_notes = notes_result.scalars().all()
    
    return StudentDashboard(
        total_classes=total_classes,
        active_session=active_session,
        recent_notes=[
            NoteOut(
                id=str(n.id),
                user_id=str(n.user_id),
                class_id=str(n.class_id),
                content=n.content,
                slide_number=n.slide_number,
                created_at=n.created_at,
                updated_at=n.updated_at
            )
            for n in recent_notes
        ]
    )
