"""
Pydantic schemas for the admin module.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============ User Admin Schemas ============

class UserAdminBase(BaseModel):
    """Base user schema for admin operations."""
    email: EmailStr
    name: Optional[str] = None
    role: str = Field(..., pattern="^(student|faculty|admin)$")
    is_active: bool = True


class UserCreateAdmin(UserAdminBase):
    """Schema for admin to create a user."""
    password: str = Field(..., min_length=8, max_length=128)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "newuser@innertia.edu",
            "name": "New User",
            "password": "securepassword123",
            "role": "student",
            "is_active": True
        }
    })


class UserUpdateAdmin(BaseModel):
    """Schema for admin to update a user."""
    name: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(student|faculty|admin)$")
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Updated Name",
            "role": "faculty",
            "is_active": True
        }
    })


class UserOutAdmin(BaseModel):
    """Schema for user response in admin."""
    id: str
    email: str
    name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    users: List[UserOutAdmin]
    total: int
    page: int
    page_size: int


# ============ Bulk Upload Schemas ============

class BulkUploadResponse(BaseModel):
    """Schema for bulk upload response."""
    created_count: int = 0
    updated_count: int = 0
    failed_rows: List[dict] = []
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "created_count": 5,
            "updated_count": 3,
            "failed_rows": [
                {"row": 2, "error": "Invalid email format"}
            ]
        }
    })


# ============ Class Admin Schemas ============

class ClassCreate(BaseModel):
    """Schema for creating a class."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    faculty_id: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Introduction to Computer Science",
            "description": "Basic CS course",
            "faculty_id": "uuid-of-faculty"
        }
    })


class ClassUpdate(BaseModel):
    """Schema for updating a class."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Updated Course Name",
            "description": "Updated description",
            "is_active": True
        }
    })


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


# ============ Dashboard Schemas ============

class DashboardStats(BaseModel):
    """Schema for admin dashboard statistics."""
    total_users: int
    total_students: int
    total_faculty: int
    total_admins: int
    total_classes: int
    total_sessions: int
    active_sessions: int
    last_30_day_sessions: int
    users_by_role: dict
    average_attendance_rate: float
    total_violations_7_days: int
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_users": 100,
            "total_students": 80,
            "total_faculty": 15,
            "total_admins": 5,
            "total_classes": 10,
            "total_sessions": 50,
            "active_sessions": 2,
            "last_30_day_sessions": 15,
            "users_by_role": {
                "admin": 5,
                "faculty": 15,
                "student": 80
            },
            "average_attendance_rate": 78.5,
            "total_violations_7_days": 12
        }
    })


# ============ Session Monitoring Schemas ============

class SessionMonitorOut(BaseModel):
    """Schema for session monitoring response."""
    id: str
    class_id: str
    class_name: str
    faculty_id: str
    faculty_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    is_active: bool
    duration_minutes: Optional[int] = None
    student_count: int = 0
    engagement_percent: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    """Schema for paginated session list."""
    sessions: List[SessionMonitorOut]
    total: int
    page: int
    page_size: int


# ============ Attendance Analytics Schemas ============

class AttendanceAnalyticsResponse(BaseModel):
    """Schema for attendance analytics response."""
    date: str
    attendance_rate: float
    session_count: int
    violation_count: int

    model_config = ConfigDict(from_attributes=True)


class AttendanceAnalyticsSummary(BaseModel):
    """Schema for attendance analytics summary."""
    daily_data: List[AttendanceAnalyticsResponse]
    average_attendance_rate: float
    total_sessions: int
    total_violations: int
    date_range_start: str
    date_range_end: str

    model_config = ConfigDict(from_attributes=True)


# ============ Session Detail Schemas ============

class SessionDetailResponse(BaseModel):
    """Schema for session detail response (admin oversight)."""
    id: str
    class_id: str
    class_name: str
    faculty_id: str
    faculty_name: str
    start_time: datetime
    end_time: Optional[datetime]
    is_active: bool
    duration_minutes: Optional[int]
    total_students: int
    attendance_percentage: float
    violation_count: int

    model_config = ConfigDict(from_attributes=True)


# ============ System Settings Schemas ============

class SystemSettingsResponse(BaseModel):
    """Schema for system settings response."""
    attendance_threshold: int
    max_focus_violations: int
    session_timeout_minutes: int

    model_config = ConfigDict(from_attributes=True)


class SystemSettingsUpdate(BaseModel):
    """Schema for updating system settings."""
    attendance_threshold: Optional[int] = Field(None, ge=0, le=100)
    max_focus_violations: Optional[int] = Field(None, ge=1)
    session_timeout_minutes: Optional[int] = Field(None, ge=1)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "attendance_threshold": 80,
            "max_focus_violations": 5,
            "session_timeout_minutes": 120
        }
    })


# ============ Audit Log Viewer Schemas ============

class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: str
    action: str
    performed_by: str
    target_type: Optional[str]
    target_id: Optional[int]
    metadata_json: Optional[str]
    created_at: datetime
    ip_address: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log list."""
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int


# ============ Multi-Tenant College Schemas ============

class CollegeCreate(BaseModel):
    """Schema for creating a college."""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=2, max_length=100, pattern="^[A-Z0-9_]+$")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "MIT College of Engineering",
            "code": "MIT_ENG"
        }
    })


class CollegeUpdate(BaseModel):
    """Schema for updating a college."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Updated College Name",
            "is_active": True
        }
    })


class CollegeOut(BaseModel):
    """Schema for college response."""
    id: str
    name: str
    code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CollegeWithStats(CollegeOut):
    """Schema for college with statistics."""
    total_users: int = 0
    user_counts: dict = {}
    
    model_config = ConfigDict(from_attributes=True)


class CollegeListResponse(BaseModel):
    """Schema for paginated college list."""
    colleges: List[CollegeOut]
    total: int
    page: int
    page_size: int


# ============ Feature Toggle Schemas ============

class FeatureToggleRequest(BaseModel):
    """Schema for toggling a feature."""
    feature_key: str = Field(..., pattern="^[a-z_]+$")
    is_enabled: bool
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "feature_key": "attendance_tracking",
            "is_enabled": True
        }
    })


class FeatureToggleResponse(BaseModel):
    """Schema for feature toggle response."""
    id: str
    college_id: str
    feature_key: str
    is_enabled: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FeatureListResponse(BaseModel):
    """Schema for feature list response."""
    features: List[FeatureToggleResponse]


# ============ Role Permission Schemas ============

class RolePermissionRequest(BaseModel):
    """Schema for setting role permission."""
    role: str = Field(..., pattern="^(staff|faculty|trainer|student)$")
    feature_key: str = Field(..., pattern="^[a-z_]+$")
    is_enabled: bool
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "role": "faculty",
            "feature_key": "attendance_tracking",
            "is_enabled": True
        }
    })


class RolePermissionResponse(BaseModel):
    """Schema for role permission response."""
    id: str
    college_id: str
    role: str
    feature_key: str
    is_enabled: bool
    
    model_config = ConfigDict(from_attributes=True)


class RolePermissionListResponse(BaseModel):
    """Schema for role permission list response."""
    permissions: List[RolePermissionResponse]


# ============ Updated User Admin Schemas ============

class UserAdminBase(BaseModel):
    """Base user schema for admin operations."""
    email: EmailStr
    name: Optional[str] = None
    role: str = Field(..., pattern="^(platform_admin|college_admin|staff|faculty|trainer|student)$")
    is_active: bool = True


class UserCreateAdmin(UserAdminBase):
    """Schema for admin to create a user."""
    password: str = Field(..., min_length=8, max_length=128)
    college_id: Optional[str] = None  # Required for non-platform_admin roles
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "newuser@innertia.edu",
            "name": "New User",
            "password": "securepassword123",
            "role": "student",
            "college_id": "uuid-of-college",
            "is_active": True
        }
    })
