"""
College Admin schemas.
Pydantic models for college admin role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime


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

class UserCreateRequest(BaseModel):
    """Request to create a user in the college."""
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User full name")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    role: str = Field(..., description="User role (staff, faculty, trainer, student)")
    is_active: bool = Field(True, description="Whether user is active")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "john.doe@college.edu",
            "name": "John Doe",
            "password": "securepass123",
            "role": "student",
            "is_active": True
        }
    })


class UserBulkCreateRequest(BaseModel):
    """Request to bulk create users in the college."""
    users: List[UserCreateRequest] = Field(..., description="List of users to create")


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


# =============================================================================
# AUDIT LOGS
# =============================================================================

class AuditLogResponse(BaseModel):
    """Audit log response model."""
    id: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata_json: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    performed_by: str
    performed_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Paginated list of audit logs."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# BULK UPLOAD
# =============================================================================

class BulkUploadFailedRow(BaseModel):
    """Failed row in bulk upload."""
    row: int
    email: str
    error: str


class BulkUploadResponse(BaseModel):
    """Response for bulk user upload."""
    created_count: int
    updated_count: int
    failed_rows: List[BulkUploadFailedRow]
