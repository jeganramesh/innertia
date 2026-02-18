"""
Pydantic schemas for the faculty module.
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
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClassWithEnrollment(BaseModel):
    """Schema for class with enrollment count."""
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    enrollment_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Session Schemas ============

class SessionStart(BaseModel):
    """Schema for starting a session."""
    class_id: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "class_id": "uuid-of-class"
        }
    })


class SessionOut(BaseModel):
    """Schema for session response."""
    id: str
    class_id: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SlideLockToggle(BaseModel):
    """Schema for slide lock toggle."""
    is_locked: bool
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "is_locked": True
        }
    })


class SlideStateOut(BaseModel):
    """Schema for slide state response."""
    id: str
    session_id: str
    current_slide: int
    is_locked: bool
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Student Sync Schemas ============

class StudentSyncStatus(BaseModel):
    """Schema for student sync status."""
    user_id: str
    email: str
    name: Optional[str]
    last_sync: Optional[datetime]
    current_slide: int
    is_in_session: bool
    
    model_config = ConfigDict(from_attributes=True)


class StudentSyncList(BaseModel):
    """Schema for list of student sync statuses."""
    students: List[StudentSyncStatus]
    total: int


# ============ Dashboard Schemas ============

class FacultyDashboard(BaseModel):
    """Schema for faculty dashboard."""
    total_classes: int
    total_students: int
    recent_sessions: List[SessionOut]
    active_session: Optional[SessionOut]
    
    model_config = ConfigDict(from_attributes=True)
