"""
AI Notes router.
Handles endpoints for generating and managing AI-generated immersive notes.
Accessible by Admin, Faculty, and Student roles.
"""

import uuid
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.core.feature_guard import require_feature
from app.accounts.dependencies import require_any_role, get_current_active_user
from app.models.models import User, Class, AINote, Enrollment
from app.ai_notes.schemas import (
    GenerateRequest, GenerateResponse, SaveNotesRequest,
    AINoteOut, AINoteList
)
from app.ai_notes.service import generate_notes

router = APIRouter(prefix="/ai-notes", tags=["AI Notes"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_immersive_notes(
    data: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_feature("ai_notes"))
):
    """
    Generate immersive notes from raw lesson text.
    
    Access:
    - Admin: Can generate for any class
    - Faculty: Can generate for their own classes
    - Student: Can generate for enrolled classes
    """
    # Validate class exists
    try:
        class_uuid = uuid.UUID(data.class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Check class exists
    result = await db.execute(
        select(Class).where(Class.id == class_uuid)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Role-based access control
    if current_user.role.value == "admin":
        # Admin can access all classes
        pass
    elif current_user.role.value == "faculty":
        # Faculty can only generate for their own classes
        if class_obj.faculty_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate notes for your own classes"
            )
    else:
        # Student can only generate for enrolled classes
        enrollment_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.user_id == current_user.id,
                    Enrollment.class_id == class_uuid
                )
            )
        )
        if not enrollment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate notes for classes you're enrolled in"
            )
    
    # Generate the immersive notes
    generated_content = await generate_notes(data)
    
    return generated_content


@router.post("/save", response_model=AINoteOut)
async def save_immersive_notes(
    data: SaveNotesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_feature("ai_notes"))
):
    """
    Save generated immersive notes to the database.
    
    Access:
    - Admin: Can save to any class
    - Faculty: Can save to their own classes
    - Student: Cannot save (read-only access)
    """
    # Validate class exists
    try:
        class_uuid = uuid.UUID(data.class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    # Check class exists
    result = await db.execute(
        select(Class).where(Class.id == class_uuid)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Role-based access control
    if current_user.role.value == "admin":
        # Admin can save to all classes
        pass
    elif current_user.role.value == "faculty":
        # Faculty can only save to their own classes
        if class_obj.faculty_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only save notes for your own classes"
            )
    else:
        # Students cannot save notes
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only view AI notes, not save them"
        )
    
    # Create new AI note
    ai_note = AINote(
        class_id=class_uuid,
        lesson_title=data.lesson_title,
        raw_text=data.raw_text,
        structured_content=data.structured_content,
        created_by=current_user.id
    )
    
    db.add(ai_note)
    await db.commit()
    await db.refresh(ai_note)
    
    return AINoteOut(
        id=str(ai_note.id),
        class_id=str(ai_note.class_id),
        lesson_title=ai_note.lesson_title,
        raw_text=ai_note.raw_text,
        structured_content=ai_note.structured_content,
        created_by=str(ai_note.created_by),
        created_at=ai_note.created_at
    )


@router.get("", response_model=AINoteList)
async def get_ai_notes(
    class_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_feature("ai_notes"))
):
    """
    Get all AI notes.
    
    Access:
    - Admin: Can view all notes
    - Faculty: Can view notes for their classes
    - Student: Can view notes for enrolled classes
    """
    # Build query based on role
    if current_user.role.value == "admin":
        # Admin can view all notes
        query = select(AINote)
    elif current_user.role.value == "faculty":
        # Faculty can view their class notes
        query = select(AINote).join(Class).where(Class.faculty_id == current_user.id)
    else:
        # Student can view enrolled class notes
        query = select(AINote).join(Class).join(Enrollment).where(
            Enrollment.user_id == current_user.id
        )
    
    if class_id:
        try:
            class_uuid = uuid.UUID(class_id)
            query = query.where(AINote.class_id == class_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid class ID format"
            )
    
    query = query.order_by(AINote.created_at.desc())
    
    result = await db.execute(query)
    notes = result.scalars().all()
    
    return AINoteList(
        notes=[
            AINoteOut(
                id=str(note.id),
                class_id=str(note.class_id),
                lesson_title=note.lesson_title,
                raw_text=note.raw_text,
                structured_content=note.structured_content,
                created_by=str(note.created_by),
                created_at=note.created_at
            )
            for note in notes
        ],
        total=len(notes)
    )


@router.get("/{note_id}", response_model=AINoteOut)
async def get_ai_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_feature("ai_notes"))
):
    """
    Get a specific AI note by ID.
    
    Access:
    - Admin: Can view any note
    - Faculty: Can view notes for their classes
    - Student: Can view notes for enrolled classes
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get note first
    result = await db.execute(
        select(AINote).where(AINote.id == note_uuid)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI note not found"
        )
    
    # Get class info
    class_result = await db.execute(
        select(Class).where(Class.id == note.class_id)
    )
    class_obj = class_result.scalar_one_or_none()
    
    # Role-based access control
    if current_user.role.value == "admin":
        pass  # Admin can access all
    elif current_user.role.value == "faculty":
        if class_obj.faculty_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this note"
            )
    else:
        # Student - check enrollment
        enrollment_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.user_id == current_user.id,
                    Enrollment.class_id == note.class_id
                )
            )
        )
        if not enrollment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this note"
            )
    
    return AINoteOut(
        id=str(note.id),
        class_id=str(note.class_id),
        lesson_title=note.lesson_title,
        raw_text=note.raw_text,
        structured_content=note.structured_content,
        created_by=str(note.created_by),
        created_at=note.created_at
    )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_feature("ai_notes"))
):
    """
    Delete an AI note.
    
    Access:
    - Admin: Can delete any note
    - Faculty: Can delete notes for their classes
    - Student: Cannot delete notes (read-only)
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    # Get note first
    result = await db.execute(
        select(AINote).where(AINote.id == note_uuid)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI note not found"
        )
    
    # Get class info
    class_result = await db.execute(
        select(Class).where(Class.id == note.class_id)
    )
    class_obj = class_result.scalar_one_or_none()
    
    # Role-based access control - students cannot delete
    if current_user.role.value == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot delete AI notes"
        )
    elif current_user.role.value == "faculty":
        if class_obj.faculty_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this note"
            )
    # Admin can delete all
    
    await db.delete(note)
    await db.commit()
    
    return None
