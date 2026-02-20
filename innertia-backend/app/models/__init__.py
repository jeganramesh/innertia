"""
Models package for Innertia Academic OS.

Production-Grade Database Schema:
- Users (admin/faculty/student roles)
- Classes (courses with faculty)
- Enrollments (student-class relationships)
- Sessions (live class sessions)
- SlideStates (current slide tracking)
- SlideActivity (per-student behavior for heatmap)
- AINotes (AI-generated immersive notes)
- AuditLogs (mandatory production audit trail)
- SystemSettings (feature toggles)
"""

from app.models.base import Base
from app.models.models import (
    # Core models
    User,
    RefreshToken,
    Class,
    Session,
    Enrollment,
    SlideState,
    SlideActivity,
    AINote,
    AuditLog,
    SystemSetting,
    Note,
    # Enums
    RoleEnum,
)

__all__ = [
    # Base
    "Base",
    # Core models
    "User",
    "RefreshToken",
    "Class",
    "Session",
    "Enrollment",
    "SlideState",
    "SlideActivity",
    "AINote",
    "AuditLog",
    "SystemSetting",
    "Note",
    # Enums
    "RoleEnum",
]
