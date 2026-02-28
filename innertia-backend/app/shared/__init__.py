"""
Shared utilities and permissions for the platform.
"""

from app.shared.permissions import (
    Role,
    Resource,
    Action,
    PERMISSION_MATRIX,
    has_permission,
    get_role_permissions,
    require_roles,
    require_permission,
    verify_college_access,
    filter_by_college,
    verify_ownership,
    is_platform_admin,
    is_college_admin,
    is_faculty,
    is_trainer,
    is_student,
    is_staff,
    is_admin_or_college_admin,
    validate_college_assignment,
)

__all__ = [
    "Role",
    "Resource", 
    "Action",
    "PERMISSION_MATRIX",
    "has_permission",
    "get_role_permissions",
    "require_roles",
    "require_permission",
    "verify_college_access",
    "filter_by_college",
    "verify_ownership",
    "is_platform_admin",
    "is_college_admin",
    "is_faculty",
    "is_trainer",
    "is_student",
    "is_staff",
    "is_admin_or_college_admin",
    "validate_college_assignment",
]
