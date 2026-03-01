"""
College Admin schemas.
Pydantic models for college admin role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


# =============================================================================
# DASHBOARD
# =============================================================================

class CollegeAdminDashboardStats(BaseModel):
    """College admin dashboard statistics."""
    total_users: int
    total_classes: int
    active_sessions: int
    total_students: int
    total_faculty: int


class CollegeAdminDashboardUser(BaseModel):
    """College admin user info in dashboard."""
    id: str
    email: str
    full_name: str
    college_name: Optional[str] = None


class CollegeAdminDashboardResponse(BaseModel):
    """College admin dashboard response."""
    user: CollegeAdminDashboardUser
    stats: CollegeAdminDashboardStats


# =============================================================================
# USERS
# =============================================================================

class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: str
    name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str


class UserListResponse(BaseModel):
    """Paginated list of users."""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserUpdateRequest(BaseModel):
    """Request to update a user."""
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# =============================================================================
# CLASSES
# =============================================================================

class ClassResponse(BaseModel):
    """Class response model."""
    id: str
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None
    is_archived: bool = False


class ClassListResponse(BaseModel):
    """Paginated list of classes."""
    items: List[ClassResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ClassCreateRequest(BaseModel):
    """Request to create a class."""
    name: str
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None


class ClassUpdateRequest(BaseModel):
    """Request to update a class."""
    name: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None
    faculty_id: Optional[str] = None
    is_archived: Optional[bool] = None


# =============================================================================
# ENROLLMENTS
# =============================================================================

class EnrollmentResponse(BaseModel):
    """Enrollment response model."""
    id: str
    student_id: str
    student_name: str
    student_email: str
    class_id: str
    class_name: str
    enrolled_at: str


class EnrollmentListResponse(BaseModel):
    """Paginated list of enrollments."""
    items: List[EnrollmentResponse]
    total: int
    page: int
    page_size: int
    pages: int


class EnrollmentCreateRequest(BaseModel):
    """Request to create an enrollment."""
    student_id: str
    class_id: str


# =============================================================================
# ROLE FEATURES / PERMISSIONS
# =============================================================================

class RoleFeaturePermissionResponse(BaseModel):
    """Role feature permission response."""
    id: str
    feature_key: str
    role: str
    is_enabled: bool


class RoleFeaturePermissionUpdateRequest(BaseModel):
    """Request to update role feature permission."""
    is_enabled: bool


class RoleFeaturePermissionListResponse(BaseModel):
    """List of role feature permissions."""
    items: List[RoleFeaturePermissionResponse]
    total: int
