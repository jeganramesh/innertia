"""
Pydantic schemas for the student module.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ============ Class Schemas ============

class ClassOut(BaseModel):
    """Schema for class response."""
    id: str
    name: str
    description: Optional[str]
    faculty_id: str
    faculty_name: Optional[str]
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class EnrollmentOut(BaseModel):
    """Schema for enrollment response."""
    id: str
    class_id: str
    class_name: str
    faculty_name: Optional[str]
    enrolled_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Session Schemas ============

class SessionOut(BaseModel):
    """Schema for session response."""
    id: str
    class_id: str
    class_name: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SessionJoin(BaseModel):
    """Schema for joining a session."""
    session_id: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "session_id": "uuid-of-session"
        }
    })


# ============ Slide Schemas ============

class SlideStateOut(BaseModel):
    """Schema for slide state response."""
    id: str
    session_id: str
    current_slide: int
    is_locked: bool
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Notes Schemas ============

class NoteCreate(BaseModel):
    """Schema for creating a note."""
    class_id: str
    content: str
    slide_number: Optional[int] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "class_id": "uuid-of-class",
            "content": "Important note about this slide",
            "slide_number": 5
        }
    })


class NoteUpdate(BaseModel):
    """Schema for updating a note."""
    content: Optional[str] = None
    slide_number: Optional[int] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "content": "Updated note content",
            "slide_number": 10
        }
    })


class NoteOut(BaseModel):
    """Schema for note response."""
    id: str
    user_id: str
    class_id: str
    content: str
    slide_number: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NoteList(BaseModel):
    """Schema for list of notes."""
    notes: List[NoteOut]
    total: int


# ============ Dashboard Schemas ============

class StudentDashboard(BaseModel):
    """Schema for student dashboard."""
    total_classes: int
    active_session: Optional[SessionOut]
    recent_notes: List[NoteOut]
    
    model_config = ConfigDict(from_attributes=True)
