"""
Student schemas.
Pydantic models for student role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel


# =============================================================================
# DASHBOARD
# =============================================================================

class StudentDashboardStats(BaseModel):
    """Student dashboard statistics."""
    enrolled_classes: int
    active_sessions: int


class StudentDashboardUser(BaseModel):
    """Student user info in dashboard."""
    id: str
    email: str
    full_name: str


class StudentDashboardResponse(BaseModel):
    """Student dashboard response."""
    user: StudentDashboardUser
    stats: StudentDashboardStats


# =============================================================================
# ENROLLMENTS
# =============================================================================

class EnrollmentResponse(BaseModel):
    """Enrollment response model."""
    id: str
    class_id: str
    class_name: str
    department: Optional[str] = None
    enrolled_at: str


class EnrollmentListResponse(BaseModel):
    """Paginated list of enrollments."""
    items: List[EnrollmentResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# CLASSES
# =============================================================================

class StudentClassResponse(BaseModel):
    """Student class response model."""
    id: str
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None


class StudentClassListResponse(BaseModel):
    """Paginated list of student classes."""
    items: List[StudentClassResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# SESSIONS
# =============================================================================

class SessionResponse(BaseModel):
    """Session response model for students."""
    id: str
    class_id: str
    class_name: Optional[str] = None
    title: Optional[str] = None
    is_active: bool
    start_time: Optional[str] = None


class SessionListResponse(BaseModel):
    """Paginated list of active sessions."""
    items: List[SessionResponse]
    total: int
    page: int
    page_size: int
    pages: int
