"""
Shared permissions system for role-based access control.

This module provides:
1. Role enum definitions
2. Permission matrix
3. Role guards for FastAPI endpoints
4. Ownership verification utilities
"""

from enum import Enum
from functools import wraps
from typing import List, Optional, Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import User, RoleEnum as ModelRoleEnum


# =============================================================================
# ROLE DEFINITIONS
# =============================================================================

class Role(str, Enum):
    """User role enumeration for the platform.
    
    Hierarchy:
    - admin: System-wide administrator (SaaS owner)
    - college_admin: College-level administrator
    - staff: Non-teaching administrative staff
    - faculty: Teaching staff
    - trainer: Placement/assessment trainer
    - student: Enrolled students
    """
    ADMIN = "admin"
    COLLEGE_ADMIN = "college_admin"
    STAFF = "staff"
    FACULTY = "faculty"
    TRAINER = "trainer"
    STUDENT = "student"


class Resource(str, Enum):
    """Resources that can be accessed in the system."""
    COLLEGES = "colleges"
    USERS = "users"
    CLASSES = "classes"
    SESSIONS = "sessions"
    ENROLLMENTS = "enrollments"
    ANALYTICS = "analytics"
    AUDIT_LOGS = "audit_logs"
    FEATURES = "features"
    DEPARTMENTS = "departments"
    AI_NOTES = "ai_notes"


class Action(str, Enum):
    """Actions that can be performed on resources."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXPORT = "export"
    MANAGE = "manage"


# =============================================================================
# PERMISSION MATRIX
# =============================================================================

# Role -> Resource -> Allowed Actions
PERMISSION_MATRIX: dict[str, dict[str, list[str]]] = {
    Role.ADMIN.value: {
        Resource.COLLEGES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.USERS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.CLASSES: [Action.READ],
        Resource.SESSIONS: [Action.READ],
        Resource.ENROLLMENTS: [Action.READ],
        Resource.ANALYTICS: [Action.READ, Action.EXPORT],
        Resource.AUDIT_LOGS: [Action.READ, Action.EXPORT],
        Resource.FEATURES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.DEPARTMENTS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.AI_NOTES: [Action.READ],
    },
    Role.COLLEGE_ADMIN.value: {
        Resource.COLLEGES: [Action.READ],
        Resource.USERS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.CLASSES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.SESSIONS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.ENROLLMENTS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.ANALYTICS: [Action.READ, Action.EXPORT],
        Resource.AUDIT_LOGS: [Action.READ, Action.EXPORT],
        Resource.DEPARTMENTS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.AI_NOTES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    },
    Role.STAFF.value: {
        Resource.COLLEGES: [Action.READ],
        Resource.USERS: [Action.READ],
        Resource.CLASSES: [Action.READ],
        Resource.SESSIONS: [Action.READ],
        Resource.ENROLLMENTS: [Action.READ],
        Resource.ANALYTICS: [Action.READ],
    },
    Role.FACULTY.value: {
        Resource.COLLEGES: [],
        Resource.USERS: [],
        Resource.CLASSES: [Action.READ],
        Resource.SESSIONS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.ENROLLMENTS: [Action.READ],
        Resource.AI_NOTES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    },
    Role.TRAINER.value: {
        Resource.COLLEGES: [],
        Resource.USERS: [],
        Resource.CLASSES: [Action.READ],
        Resource.SESSIONS: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
        Resource.ENROLLMENTS: [Action.READ],
        Resource.AI_NOTES: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    },
    Role.STUDENT.value: {
        Resource.COLLEGES: [],
        Resource.USERS: [],
        Resource.CLASSES: [Action.READ],
        Resource.SESSIONS: [Action.READ],
        Resource.ENROLLMENTS: [Action.READ],
        Resource.AI_NOTES: [Action.READ],
    },
}


# =============================================================================
# PERMISSION CHECKER
# =============================================================================

def has_permission(role: str, resource: str, action: str) -> bool:
    """
    Check if a role has permission to perform an action on a resource.
    
    Args:
        role: User's role
        resource: Resource being accessed
        action: Action being performed
        
    Returns:
        True if permission is granted, False otherwise
    """
    # Normalize role to lowercase for case-insensitive comparison
    normalized_role = (role or '').lower()
    role_perms = PERMISSION_MATRIX.get(normalized_role, {})
    resource_perms = role_perms.get(resource, [])
    return action in resource_perms


def get_role_permissions(role: str) -> dict[str, list[str]]:
    """Get all permissions for a role."""
    normalized_role = (role or '').lower()
    return PERMISSION_MATRIX.get(normalized_role, {})


# =============================================================================
# FASTAPI DEPENDENCIES
# =============================================================================

async def get_current_user_with_role(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_db)
) -> User:
    """
    Get the current authenticated user with full role information.
    This is an alias for backward compatibility.
    """
    return user


def require_roles(*allowed_roles: str):
    """
    FastAPI dependency that restricts access to specific roles.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user=Depends(require_roles("admin"))):
            ...
    
    Args:
        *allowed_roles: List of role names that are allowed to access the endpoint
        
    Raises:
        HTTPException 403: If user's role is not in allowed_roles
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        # Normalize role to lowercase for case-insensitive comparison
        user_role = (current_user.role or '').lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_permission(resource: str, action: str):
    """
    FastAPI dependency that checks role-based permissions.
    
    Usage:
        @router.post("/classes")
        async def create_class(
            user=Depends(require_permission("classes", "create"))
        ):
            ...
    
    Args:
        resource: Resource being accessed
        action: Action being performed
        
    Raises:
        HTTPException 403: If user doesn't have permission
    """
    async def permission_checker(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user.role, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. {action} on {resource} not allowed for role {current_user.role}"
            )
        return current_user
    
    return permission_checker
    
    return permission_checker


# =============================================================================
# COLLEGE ISOLATION HELPERS
# =============================================================================

def get_current_user():
    """
    Placeholder for getting current user.
    This will be imported from accounts.dependencies in actual usage.
    """
    from app.accounts.dependencies import get_current_user as _get_current_user
    return _get_current_user


async def verify_college_access(
    current_user: User,
    resource_college_id: Optional[UUID],
    allow_admin: bool = True
) -> None:
    """
    Verify that a user has access to a resource based on college isolation.
    
    Args:
        current_user: The authenticated user
        resource_college_id: The college_id of the resource being accessed
        allow_admin: Whether admin can access any college's data
        
    Raises:
        HTTPException 403: If access is denied
    """
    # Admin can access any college's data
    if allow_admin and current_user.role == Role.ADMIN.value:
        return
    
    # Non-platform admins must have a college_id
    if not current_user.college_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="College access required. User is not associated with a college."
        )
    
    # Check if resource belongs to user's college
    if resource_college_id and str(resource_college_id) != str(current_user.college_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Resource belongs to a different college."
        )


async def filter_by_college(query, model, current_user: User, db: AsyncSession):
    """
    Filter a query to only return resources from the user's college.
    
    Platform admins see all resources.
    Other roles are restricted to their college.
    
    Args:
        query: SQLAlchemy query to filter
        model: Model class being queried
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Filtered query
    """
    # Admin can see all
    if current_user.role == Role.ADMIN.value:
        return query
    
    # Others must have college_id and are restricted to their college
    if current_user.college_id:
        return query.filter(model.college_id == current_user.college_id)
    
    return query


# =============================================================================
# OWNERSHIP VERIFICATION
# =============================================================================

async def verify_ownership(
    current_user: User,
    owner_id: UUID,
    allow_college_admin: bool = True
) -> None:
    """
    Verify that the current user owns the resource or is authorized to access it.
    
    Args:
        current_user: The authenticated user
        owner_id: The ID of the resource owner
        allow_college_admin: Whether college_admin can bypass ownership check
        
    Raises:
        HTTPException 403: If access is denied
    """
    # Check exact ownership
    if str(current_user.id) == str(owner_id):
        return
    
    # College admin can manage all resources in their college
    if allow_college_admin and current_user.role == Role.COLLEGE_ADMIN.value:
        return
    
    # Admin can manage everything
    if current_user.role == Role.ADMIN.value:
        return
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have permission to access this resource."
    )


# =============================================================================
# ROLE CHECKERS
# =============================================================================

def is_admin(user: User) -> bool:
    """Check if user is an admin."""
    return user.role == Role.ADMIN.value


def is_college_admin(user: User) -> bool:
    """Check if user is a college admin."""
    return user.role == Role.COLLEGE_ADMIN.value


def is_faculty(user: User) -> bool:
    """Check if user is faculty."""
    return user.role == Role.FACULTY.value


def is_trainer(user: User) -> bool:
    """Check if user is a trainer."""
    return user.role == Role.TRAINER.value


def is_student(user: User) -> bool:
    """Check if user is a student."""
    return user.role == Role.STUDENT.value


def is_staff(user: User) -> bool:
    """Check if user is staff."""
    return user.role == Role.STAFF.value


def is_admin_or_college_admin(user: User) -> bool:
    """Check if user is admin or college admin."""
    return user.role in [Role.ADMIN.value, Role.COLLEGE_ADMIN.value]


# =============================================================================
# VALIDATION HELPERS
# =============================================================================

def validate_college_assignment(user: User, college_id: Optional[UUID]) -> None:
    """
    Validate that a user's college assignment is appropriate for their role.
    
    Args:
        user: The user being validated
        college_id: The college_id to assign (can be None)
        
    Raises:
        HTTPException 400: If assignment is invalid
    """
    # Admin should NOT have a college_id
    if user.role == Role.ADMIN.value and college_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin should not be assigned to a college."
        )
    
    # All other roles MUST have a college_id
    if user.role != Role.ADMIN.value and college_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with role '{user.role}' must be assigned to a college."
        )


# Import after defining dependencies to avoid circular imports
from app.accounts.dependencies import get_current_user
