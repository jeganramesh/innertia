"""
Pydantic schemas for platform admin module.
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# COLLEGE SCHEMAS
# =============================================================================

class CollegeBase(BaseModel):
    """Base college schema."""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=100)
    domain: Optional[str] = None


class CollegeCreate(CollegeBase):
    """Schema for creating a college."""
    is_active: bool = True


class CollegeUpdate(BaseModel):
    """Schema for updating a college."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = None
    is_active: Optional[bool] = None


class CollegeResponse(CollegeBase):
    """Schema for college response."""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    active_features_count: Optional[int] = 0

    class Config:
        from_attributes = True


# =============================================================================
# USER SCHEMAS (PLATFORM LEVEL)
# =============================================================================

class PlatformUserBase(BaseModel):
    """Base user schema for platform admin."""
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    college_id: Optional[UUID] = None
    is_active: bool = True


class PlatformUserCreate(PlatformUserBase):
    """Schema for creating a user at platform level."""
    password: str = Field(..., min_length=8)


class PlatformUserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    college_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class PlatformUserResponse(PlatformUserBase):
    """Schema for user response."""
    id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    college_name: Optional[str] = None

    class Config:
        from_attributes = True


# =============================================================================
# ANALYTICS SCHEMAS
# =============================================================================

class PlatformAnalyticsResponse(BaseModel):
    """Schema for platform-wide analytics."""
    total_colleges: int
    total_users: int
    total_classes: int
    total_sessions: int
    active_sessions: int
    users_by_role: dict[str, int]
    colleges_by_status: dict[str, int]


class CollegeAnalyticsResponse(BaseModel):
    """Schema for college-level analytics."""
    college_id: UUID
    college_name: str
    total_users: int
    total_classes: int
    total_sessions: int
    active_sessions: int
    users_by_role: dict[str, int]


# =============================================================================
# AUDIT LOG SCHEMAS
# =============================================================================

class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: UUID
    user_id: Optional[UUID]
    action: str
    entity_type: str
    entity_id: Optional[UUID]
    college_id: Optional[UUID]
    created_at: datetime
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit logs."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    pages: int


# =============================================================================
# BULK UPLOAD SCHEMAS
# =============================================================================

class BulkUserUploadResponse(BaseModel):
    """Response for bulk user upload."""
    success_count: int
    failed_count: int
    errors: List[str]
    users: List[PlatformUserResponse]


# =============================================================================
# COLLEGE FEATURE SCHEMAS
# =============================================================================

class CollegeFeatureToggle(BaseModel):
    """Schema for toggling a college feature."""
    feature_key: str
    is_enabled: bool


class CollegeFeatureResponse(BaseModel):
    """Schema for college feature response."""
    feature_key: str
    is_enabled: bool

    class Config:
        from_attributes = True


class CollegeFeatureListResponse(BaseModel):
    """Schema for college feature list response."""
    items: List[CollegeFeatureResponse]
    total: int


# =============================================================================
# ROLE FEATURE PERMISSION SCHEMAS
# =============================================================================

class RoleFeatureToggle(BaseModel):
    """Schema for toggling a role feature permission."""
    role: str
    feature_key: str
    is_enabled: bool


class RoleFeatureResponse(BaseModel):
    """Schema for role feature permission response."""
    role: str
    feature_key: str
    is_enabled: bool

    class Config:
        from_attributes = True


class RoleFeatureListResponse(BaseModel):
    """Schema for role feature permission list response."""
    items: List[RoleFeatureResponse]
    total: int
