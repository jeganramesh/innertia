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
    total_classes: int
    total_sessions: int
    active_sessions: int
    users_by_role: dict
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_users": 100,
            "total_classes": 10,
            "total_sessions": 50,
            "active_sessions": 2,
            "users_by_role": {
                "admin": 5,
                "faculty": 15,
                "student": 80
            }
        }
    })
