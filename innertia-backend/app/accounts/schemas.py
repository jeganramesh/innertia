"""
Pydantic schemas for the accounts module.
Handles request/response validation and serialization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============ User Schemas ============

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = Field(None, pattern="^(platform_admin|college_admin|staff|faculty|trainer|student)$")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "student@innertia.edu",
            "password": "securepassword123",
            "name": "John Doe",
            "role": "student"
        }
    })


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str = Field(..., min_length=1)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "student@innertia.edu",
            "password": "securepassword123"
        }
    })


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    name: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    """Schema for user response."""
    id: str
    name: Optional[str] = None
    role: str
    college_id: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserOut):
    """Schema for user in database (includes sensitive data)."""
    password_hash: str


# ============ Token Schemas ============

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer"
        }
    })


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: str  # User ID
    email: Optional[str] = None
    role: str
    exp: Optional[datetime] = None
    type: Optional[str] = None  # "access" or "refresh"


# ============ Response Schemas ============

class MessageResponse(BaseModel):
    """Schema for generic message response."""
    message: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "Operation completed successfully"
        }
    })


class ErrorResponse(BaseModel):
    """Schema for error response."""
    detail: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "detail": "Invalid email or password"
        }
    })


class ValidationErrorResponse(BaseModel):
    """Schema for validation error response."""
    detail: list
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "detail": [
                {
                    "loc": ["body", "email"],
                    "msg": "field required",
                    "type": "value_error.missing"
                }
            ]
        }
    })


# ============ Role Schemas ============

class RoleEnum:
    """Role constants for multi-tenant system."""
    PLATFORM_ADMIN = "platform_admin"
    COLLEGE_ADMIN = "college_admin"
    STAFF = "staff"
    FACULTY = "faculty"
    TRAINER = "trainer"
    STUDENT = "student"
    
    # Legacy roles for backward compatibility
    ADMIN = "admin"
    
    @classmethod
    def all(cls):
        return [cls.PLATFORM_ADMIN, cls.COLLEGE_ADMIN, cls.STAFF, cls.FACULTY, cls.TRAINER, cls.STUDENT]
    
    @classmethod
    def teaching_roles(cls):
        return [cls.FACULTY, cls.TRAINER]
    
    @classmethod
    def admin_roles(cls):
        return [cls.PLATFORM_ADMIN, cls.COLLEGE_ADMIN, cls.ADMIN]
