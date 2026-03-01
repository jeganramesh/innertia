"""
Authentication dependencies.
Provides FastAPI dependencies for JWT validation and role-based access control.
"""

from uuid import UUID

from typing import Optional, List
from datetime import timedelta
from jose import JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.redis import redis_client
from app.models.models import User, RoleEnum
from app.accounts.utils import decode_token, create_access_token
from app.accounts.schemas import TokenPayload
from app.core.config import settings


# HTTP Bearer scheme for JWT extraction
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
        
    Returns:
        User instance
        
    Raises:
        HTTPException: If authentication fails
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    is_blacklisted = await redis_client.is_blacklisted(token)
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decode and validate token
    try:
        payload = decode_token(token)
        token_data = TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token type
    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user_id = token_data.sub
    
    # Convert string UUID to UUID object for SQLAlchemy
    try:
        user_id_uuid = UUID(user_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id_uuid)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User if active
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def verify_college_active(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to verify that the user's college is active.
    
    Platform admins (role='admin') are exempt from this check.
    Users without a college_id are also exempt.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        User if college is active
        
    Raises:
        HTTPException: If user's college is inactive
    """
    # Platform admins are exempt
    if current_user.role and str(current_user.role).lower() == "admin":
        return current_user
    
    # Users without college are exempt
    if not current_user.college_id:
        return current_user
    
    # Load college relationship if user has college_id
    if current_user.college_id:
        result = await db.execute(
            select(User).options(selectinload(User.college)).where(User.id == current_user.id)
        )
        current_user = result.scalar_one()
    
    # Check if college is active
    if current_user.college and not current_user.college.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="College is inactive. Contact platform admin."
        )
    
    return current_user


def require_roles(allowed_roles):
    """
    Factory function to create role-based access control dependency.
    
    Args:
        allowed_roles: List of role names that are allowed, or a single role string
        
    Returns:
        Dependency function
    """
    # Handle case where a single string is passed instead of a list
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        # Case-insensitive role comparison
        user_role = str(current_user.role).lower() if current_user.role else ""
        allowed_roles_lower = [r.lower() for r in allowed_roles]
        
        if user_role not in allowed_roles_lower:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Convenience dependencies for common role combinations
require_admin = require_roles(["admin"])
require_faculty_or_admin = require_roles(["faculty", "admin", "college_admin"])
require_student_or_admin = require_roles(["student", "admin"])
require_any_role = require_roles(["student", "faculty", "admin", "college_admin", "staff", "trainer"])


async def get_user_by_email(
    email: str,
    db: AsyncSession
) -> Optional[User]:
    """
    Helper function to get user by email.
    
    Args:
        email: User email
        db: Database session
        
    Returns:
        User instance or None
    """
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


def create_user_response(user: User) -> dict:
    """
    Create user response dict from User model.
    
    Args:
        user: User model instance
        
    Returns:
        Dict with user data
    """
    # Convert role to lowercase for frontend compatibility
    user_role = str(user.role).lower() if user.role else ""
    
    # Get college_id directly from the user (no lazy loading)
    college_id = user.college_id
    
    # Check if college relationship is already loaded
    # Use object.__getattribute__ to avoid triggering lazy load
    try:
        college = object.__getattribute__(user, 'college')
        college_is_active = college.is_active if college else None
    except AttributeError:
        college_is_active = None
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name or user.full_name or "",
        "full_name": user.full_name or user.name or "",
        "role": user_role,
        "college_id": str(college_id) if college_id else None,
        "college_is_active": college_is_active,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }
