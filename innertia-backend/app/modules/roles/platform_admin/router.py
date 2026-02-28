"""
Platform admin router.
Handles platform-wide administrative operations for platform admins.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment, AuditLog
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user
from app.accounts.utils import hash_password
from app.modules.platform.admin.service import AnalyticsService
from app.modules.platform.admin.schemas import PlatformAnalyticsResponse


router = APIRouter(
    prefix="/platform-admin",
    tags=["Platform Admin"]
)


# =============================================================================
# PLATFORM ADMIN DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def platform_admin_dashboard(
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get platform admin dashboard data."""
    
    # Get total colleges
    college_count_result = await db.execute(
        select(func.count(College.id)).where(College.is_active == True)
    )
    college_count = college_count_result.scalar()
    
    # Get total users by role
    user_counts = {}
    roles = ["staff", "faculty", "trainer", "student", "college_admin"]
    for role in roles:
        result = await db.execute(
            select(func.count(User.id)).where(
                User.role == role,
                User.is_active == True,
                User.deleted_at.is_(None)
            )
        )
        user_counts[role] = result.scalar()
    
    # Platform admin count
    admin_result = await db.execute(
        select(func.count(User.id)).where(
            User.role == "platform_admin",
            User.is_active == True
        )
    )
    user_counts["platform_admin"] = admin_result.scalar()
    
    # Get total classes
    class_count_result = await db.execute(select(func.count(Class.id)))
    class_count = class_count_result.scalar()
    
    # Get active sessions
    session_count_result = await db.execute(
        select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
    )
    session_count = session_count_result.scalar()
    
    return {
        "stats": {
            "colleges": college_count,
            "platform_admins": user_counts.get("platform_admin", 0),
            "college_admins": user_counts.get("college_admin", 0),
            "staff": user_counts.get("staff", 0),
            "faculty": user_counts.get("faculty", 0),
            "trainers": user_counts.get("trainer", 0),
            "students": user_counts.get("student", 0),
            "total_users": sum(user_counts.values()),
            "classes": class_count,
            "active_sessions": session_count
        }
    }


# =============================================================================
# COLLEGE MANAGEMENT (PLATFORM ADMIN)
# =============================================================================

@router.post("/colleges")
async def create_college(
    name: str,
    code: str,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new college (platform admin only)."""
    
    # Check if college code exists
    existing = await db.execute(
        select(College).where(College.code == code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="College with this code already exists"
        )
    
    # Create college
    college = College(
        name=name,
        code=code,
        is_active=True
    )
    db.add(college)
    await db.commit()
    await db.refresh(college)
    
    return {
        "id": str(college.id),
        "name": college.name,
        "code": college.code,
        "is_active": college.is_active
    }


@router.get("/colleges")
async def list_colleges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all colleges (platform admin only)."""
    
    query = select(College)
    
    if is_active is not None:
        query = query.where(College.is_active == is_active)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                College.name.ilike(search_filter),
                College.code.ilike(search_filter)
            )
        )
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(College.created_at.desc())
    result = await db.execute(query)
    colleges = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "code": c.code,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat()
            }
            for c in colleges
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.patch("/colleges/{college_id}")
async def update_college(
    college_id: UUID,
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a college (platform admin only)."""
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    if name is not None:
        college.name = name
    if is_active is not None:
        college.is_active = is_active
    
    college.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(college)
    
    return {
        "id": str(college.id),
        "name": college.name,
        "code": college.code,
        "is_active": college.is_active
    }


# =============================================================================
# USER MANAGEMENT (PLATFORM ADMIN)
# =============================================================================

@router.post("/users")
async def create_platform_user(
    email: str,
    password: str,
    full_name: Optional[str] = None,
    role: str = "college_admin",
    college_id: Optional[UUID] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new platform or college user (platform admin only)."""
    
    # Validate role
    valid_roles = ["platform_admin", "college_admin", "staff", "faculty", "trainer", "student"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Platform admin can only be created by platform admin
    if role == "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create platform_admin users through this endpoint"
        )
    
    # College-bound roles require college_id
    if role != "platform_admin" and college_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"college_id is required for role: {role}"
        )
    
    # Verify college exists if provided
    if college_id:
        college_result = await db.execute(
            select(College).where(College.id == college_id)
        )
        if not college_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
    
    # Check if email exists
    existing = await db.execute(
        select(User).where(User.email == email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create user
    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=role,
        college_id=college_id,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "college_id": str(user.college_id) if user.college_id else None,
        "is_active": user.is_active
    }


@router.get("/users")
async def list_platform_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    college_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all platform users (platform admin only)."""
    
    query = select(User).where(User.deleted_at.is_(None))
    
    if role:
        query = query.where(User.role == role)
    if college_id:
        query = query.where(User.college_id == college_id)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_filter),
                User.full_name.ilike(search_filter)
            )
        )
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "college_id": str(u.college_id) if u.college_id else None,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.patch("/users/{user_id}")
async def update_platform_user(
    user_id: UUID,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    college_id: Optional[UUID] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a user (platform admin only)."""
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent changing own role
    if user.id == current_user.id and role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    if full_name is not None:
        user.full_name = full_name
    if role is not None:
        valid_roles = ["platform_admin", "college_admin", "staff", "faculty", "trainer", "student"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    if college_id is not None:
        user.college_id = college_id
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "college_id": str(user.college_id) if user.college_id else None,
        "is_active": user.is_active
    }


# =============================================================================
# AUDIT LOGS (PLATFORM ADMIN)
# =============================================================================

@router.get("/audit-logs")
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = None,
    performed_by: Optional[UUID] = None,
    target_type: Optional[str] = None,
    current_user: User = Depends(require_roles("platform_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List audit logs (platform admin only)."""
    
    query = select(AuditLog)
    
    if action:
        query = query.where(AuditLog.action == action)
    if performed_by:
        query = query.where(AuditLog.performed_by == performed_by)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(AuditLog.created_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(log.id),
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "performed_by": str(log.performed_by) if log.performed_by else None,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get(
    "/analytics",
    response_model=PlatformAnalyticsResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_platform_analytics(db: AsyncSession = Depends(get_db)):
    """Get platform-wide analytics (platform admin only)."""
    return await AnalyticsService.get_platform_analytics(db)
