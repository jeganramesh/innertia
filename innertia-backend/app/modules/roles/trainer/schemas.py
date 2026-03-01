"""
Trainer schemas.
Pydantic models for trainer role requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel


# =============================================================================
# DASHBOARD
# =============================================================================

class TrainerDashboardStats(BaseModel):
    """Trainer dashboard statistics."""
    sessions: int
    active_sessions: int


class TrainerDashboardUser(BaseModel):
    """Trainer user info in dashboard."""
    id: str
    email: str
    full_name: str


class TrainerDashboardResponse(BaseModel):
    """Trainer dashboard response."""
    user: TrainerDashboardUser
    stats: TrainerDashboardStats


# =============================================================================
# SESSIONS
# =============================================================================

class SessionCreateRequest(BaseModel):
    """Request to create a session."""
    class_id: str
    title: Optional[str] = None


class SessionResponse(BaseModel):
    """Session response model."""
    id: str
    class_id: str
    title: Optional[str] = None
    is_active: bool
    start_time: Optional[str] = None
    created_at: str


class SessionListResponse(BaseModel):
    """Paginated list of sessions."""
    items: List[SessionResponse]
    total: int
    page: int
    page_size: int
    pages: int
