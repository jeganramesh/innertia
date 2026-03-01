"""
Platform admin schemas.
Pydantic models for platform admin analytics and responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class PlatformAnalyticsResponse(BaseModel):
    """Platform-wide analytics response."""
    total_colleges: int = 0
    total_users: int = 0
    total_classes: int = 0
    active_sessions: int = 0
    users_by_role: Dict[str, int] = Field(default_factory=dict)
    colleges_active: int = 0
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# =============================================================================
# COLLEGE SCHEMAS
# =============================================================================

class CollegeCreate(BaseModel):
    """Schema for creating a new college."""
    name: str = Field(..., min_length=1, max_length=255, description="College name")
    code: str = Field(..., min_length=1, max_length=100, description="Unique college code")
    domain: Optional[str] = Field(None, max_length=255, description="College domain")
    add_existing_users: bool = Field(False, description="Add existing users without college to this college")


class CollegeUpdate(BaseModel):
    """Schema for updating a college."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="College name")
    code: Optional[str] = Field(None, min_length=1, max_length=100, description="Unique college code")
    domain: Optional[str] = Field(None, max_length=255, description="College domain")
    is_active: Optional[bool] = Field(None, description="Whether college is active")


class CollegeResponse(BaseModel):
    """Schema for college response."""
    id: str
    name: str
    code: str
    domain: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    users_added_count: Optional[int] = Field(None, description="Number of users added during creation")
