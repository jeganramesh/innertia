"""
AI Notes router.
Handles endpoints for generating and managing AI-generated immersive notes.
"""

import uuid
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.accounts.dependencies import require_faculty_or_admin, get_current_active_user
from app.models.models import User, Class, AINote
from app.ai_notes.schemas import (
    GenerateRequest, GenerateResponse, SaveNotesRequest,
    AINoteOut, AINoteList
)
from app.ai_notes.service import generate_notes

router = APIRouter(prefix="/faculty/ai-notes", tags=["AI Notes"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_immersive_notes(
    data: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    """
    Generate immersive notes from raw lesson text.
    
    This endpoint:
    1. Validates the class belongs to the faculty
    2. Calls Gemini AI to expand the content
    3. Enriches with Unsplash images
    4. Returns structured content with diagrams
    """
    # Validate class belongs to faculty
    try:
        class_uuid = uuid.UUID(data.class_id)
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
    
    # Generate the immersive notes
    generated_content = await generate_notes(data)
    
    return generated_content


@router.post("/save", response_model=AINoteOut)
async def save_immersive_notes(
    data: SaveNotesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    """
    Save generated immersive notes to the database.
    """
    # Validate class belongs to faculty
    try:
        class_uuid = uuid.UUID(data.class_id)
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
    current_user: User = Depends(require_faculty_or_admin)
):
    """
    Get all AI notes for the faculty's classes.
    Optionally filter by class_id.
    """
    # Build query
    query = select(AINote).join(Class).where(Class.faculty_id == current_user.id)
    
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
    current_user: User = Depends(require_faculty_or_admin)
):
    """
    Get a specific AI note by ID.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    result = await db.execute(
        select(AINote).where(
            and_(
                AINote.id == note_uuid,
                AINote.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI note not found or not authorized"
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
    current_user: User = Depends(require_faculty_or_admin)
):
    """
    Delete an AI note.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
    
    result = await db.execute(
        select(AINote).where(
            and_(
                AINote.id == note_uuid,
                AINote.class_id.in_(
                    select(Class.id).where(Class.faculty_id == current_user.id)
                )
            )
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI note not found or not authorized"
        )
    
    await db.delete(note)
    await db.commit()
    
    return None
