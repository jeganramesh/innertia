"""
Staff schemas.
Pydantic models for staff role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel


# =============================================================================
# DASHBOARD
# =============================================================================

class StaffDashboardStats(BaseModel):
    """Staff dashboard statistics."""
    classes: int
    students: int
    faculty: int


class StaffDashboardUser(BaseModel):
    """Staff user info in dashboard."""
    id: str
    email: str
    full_name: str


class StaffDashboardResponse(BaseModel):
    """Staff dashboard response."""
    user: StaffDashboardUser
    stats: StaffDashboardStats


# =============================================================================
# CLASSES
# =============================================================================

class StaffClassResponse(BaseModel):
    """Staff class response model."""
    id: str
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None


class StaffClassListResponse(BaseModel):
    """Paginated list of classes."""
    items: List[StaffClassResponse]
    total: int
    page: int
    page_size: int
    pages: int


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
