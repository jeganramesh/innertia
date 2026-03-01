"""
Faculty schemas.
Pydantic models for faculty role requests and responses.
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


# =============================================================================
# DASHBOARD
# =============================================================================

class FacultyDashboardStats(BaseModel):
    """Faculty dashboard statistics."""
    classes: int
    students: int
    active_sessions: int


class FacultyDashboardUser(BaseModel):
    """Faculty user info in dashboard."""
    id: str
    email: str
    full_name: str


class FacultySessionSummary(BaseModel):
    """Summary of a session for dashboard."""
    id: str
    class_id: str
    is_active: bool
    created_at: str


class FacultyDashboardResponse(BaseModel):
    """Faculty dashboard response."""
    user: FacultyDashboardUser
    stats: FacultyDashboardStats
    recent_sessions: List[FacultySessionSummary]


# =============================================================================
# CLASSES
# =============================================================================

class FacultyClassResponse(BaseModel):
    """Faculty class response model."""
    id: str
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    student_count: int = 0


class FacultyClassListResponse(BaseModel):
    """Paginated list of faculty classes."""
    items: List[FacultyClassResponse]
    total: int
    page: int
    page_size: int
    pages: int


class FacultyClassDetailResponse(FacultyClassResponse):
    """Detailed faculty class with sessions."""
    sessions: List[dict] = []


# =============================================================================
# SESSIONS
# =============================================================================

class SessionCreateRequest(BaseModel):
    """Request to create a session."""
    class_id: UUID
    title: Optional[str] = None


class SessionResponse(BaseModel):
    """Session response model."""
    id: str
    class_id: str
    title: Optional[str] = None
    is_active: bool
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: str


class SessionListResponse(BaseModel):
    """Paginated list of sessions."""
    items: List[SessionResponse]
    total: int
    page: int
    page_size: int
    pages: int


class SessionStartResponse(BaseModel):
    """Response after starting a session."""
    id: str
    is_active: bool
    start_time: str


class SessionEndResponse(BaseModel):
    """Response after ending a session."""
    id: str
    is_active: bool
    end_time: str


# =============================================================================
# ENROLLMENTS
# =============================================================================

class EnrollmentStudentResponse(BaseModel):
    """Student info in enrollment."""
    id: str
    student_id: str
    student_name: str
    student_email: str
    enrolled_at: str


class EnrollmentListResponse(BaseModel):
    """Paginated list of enrollments."""
    items: List[EnrollmentStudentResponse]
    total: int
    page: int
    page_size: int
    pages: int
