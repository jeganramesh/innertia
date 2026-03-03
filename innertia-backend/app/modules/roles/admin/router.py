"""
Admin router.
Handles platform-wide administrative operations for admins.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment, AuditLog
from app.shared.permissions import require_roles
from app.shared.audit_helpers import create_audit_log
from app.accounts.dependencies import get_current_user
from app.accounts.utils import hash_password
from app.modules.platform.admin.service import AnalyticsService
from app.modules.platform.admin.schemas import PlatformAnalyticsResponse


# =============================================================================
# SCHEMAS
# =============================================================================

class UserUpdateRequest(BaseModel):
    """Request to update a user."""
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    college_id: Optional[UUID] = None


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =============================================================================
# ADMIN DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def admin_dashboard(
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard data."""
    
    from datetime import datetime, timedelta
    
    # Get total colleges
    college_count_result = await db.execute(
        select(func.count(College.id)).where(College.is_active == True)
    )
    college_count = college_count_result.scalar() or 0
    
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
        user_counts[role] = result.scalar() or 0
    
    # Admin count
    admin_result = await db.execute(
        select(func.count(User.id)).where(
            User.role == "admin",
            User.is_active == True
        )
    )
    user_counts["admin"] = admin_result.scalar() or 0
    
    # Get total classes
    class_count_result = await db.execute(select(func.count(Class.id)))
    class_count = class_count_result.scalar() or 0
    
    # Get active sessions
    active_session_result = await db.execute(
        select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
    )
    active_sessions = active_session_result.scalar() or 0
    
    # Get total sessions (all time)
    total_session_result = await db.execute(select(func.count(SessionModel.id)))
    total_sessions = total_session_result.scalar() or 0
    
    # Get sessions in the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_30_day_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.started_at >= thirty_days_ago
        )
    )
    last_30_day_sessions = last_30_day_result.scalar() or 0
    
    # Calculate average attendance rate (simplified - based on enrollments)
    enrollment_count_result = await db.execute(
        select(func.count(Enrollment.id))
    )
    total_enrollments = enrollment_count_result.scalar() or 0
    
    # For average attendance, we'll calculate from present marks if available
    # For now, let's return a placeholder since we don't have attendance records
    average_attendance_rate = 0.0
    
    # Get violations in last 7 days (simplified - return 0 for now)
    total_violations_7_days = 0
    
    # Return data in format expected by frontend
    return {
        "total_users": sum(user_counts.values()),
        "total_students": user_counts.get("student", 0),
        "total_faculty": user_counts.get("faculty", 0),
        "total_admins": user_counts.get("admin", 0),
        "total_classes": class_count,
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "last_30_day_sessions": last_30_day_sessions,
        "users_by_role": {
            "admin": user_counts.get("admin", 0),
            "faculty": user_counts.get("faculty", 0),
            "student": user_counts.get("student", 0)
        },
        "average_attendance_rate": average_attendance_rate,
        "total_violations_7_days": total_violations_7_days,
        "total_colleges": college_count,
        "total_staff": user_counts.get("staff", 0),
        "total_trainers": user_counts.get("trainer", 0),
        "total_college_admins": user_counts.get("college_admin", 0)
    }


# =============================================================================
# COLLEGE MANAGEMENT (ADMIN)
# =============================================================================

@router.post("/colleges")
async def create_college(
    name: str,
    code: str,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new college (admin only)."""
    
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
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all colleges (admin only)."""
    
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
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a college (admin only)."""
    
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
# USER MANAGEMENT (ADMIN)
# =============================================================================

@router.post("/users")
async def create_admin_user(
    email: str = Form(...),
    password: str = Form(...),
    full_name: Optional[str] = Form(None),
    role: str = Form("college_admin"),
    college_id: Optional[UUID] = Form(None),
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new platform or college user (admin only)."""
    
    # Validate role
    valid_roles = ["admin", "college_admin", "staff", "faculty", "trainer", "student"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Admin can only be created by admin
    if role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create admin users through this endpoint"
        )
    
    # College-bound roles require college_id
    if role != "admin" and college_id is None:
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
    
    # Check if email exists (including soft-deleted users due to DB unique constraint)
    existing = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = existing.scalar_one_or_none()
    if existing_user:
        if existing_user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists but was previously deleted. Contact support to restore the account."
            )
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
async def list_admin_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    college_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all platform users (admin only)."""
    
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
async def update_admin_user(
    user_id: UUID,
    request: UserUpdateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a user (admin only)."""
    
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
    if user.id == current_user.id and request.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Store old values for audit logging
    old_role = user.role
    old_is_active = user.is_active
    old_college_id = user.college_id
    
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.role is not None:
        valid_roles = ["admin", "college_admin", "staff", "faculty", "trainer", "student"]
        if request.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        user.role = request.role
    if request.is_active is not None:
        user.is_active = request.is_active
    if request.college_id is not None:
        user.college_id = request.college_id
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    # Create audit log entries for role changes
    if request.role is not None and request.role != old_role:
        await create_audit_log(
            db=db,
            action="USER_ROLE_CHANGE",
            performed_by=current_user.id,
            target_type="User",
            target_id=str(user.id),
            college_id=user.college_id,
            metadata={
                "user_email": user.email,
                "old_role": old_role,
                "new_role": request.role
            }
        )
        await db.commit()
    
    # Create audit log entries for is_active changes
    if request.is_active is not None and request.is_active != old_is_active:
        await create_audit_log(
            db=db,
            action="USER_ACTIVE_TOGGLE",
            performed_by=current_user.id,
            target_type="User",
            target_id=str(user.id),
            college_id=user.college_id,
            metadata={
                "user_email": user.email,
                "old_is_active": old_is_active,
                "new_is_active": request.is_active
            }
        )
        await db.commit()
    
    # Create audit log entries for college assignment changes
    if request.college_id is not None and request.college_id != old_college_id:
        old_college_name = None
        new_college_name = None
        if old_college_id:
            result = await db.execute(select(College).where(College.id == old_college_id))
            old_college = result.scalar_one_or_none()
            if old_college:
                old_college_name = old_college.name
        if request.college_id:
            result = await db.execute(select(College).where(College.id == request.college_id))
            new_college = result.scalar_one_or_none()
            if new_college:
                new_college_name = new_college.name
        
        await create_audit_log(
            db=db,
            action="USER_COLLEGE_ASSIGN",
            performed_by=current_user.id,
            target_type="User",
            target_id=str(user.id),
            college_id=request.college_id,
            metadata={
                "user_email": user.email,
                "old_college_id": str(old_college_id) if old_college_id else None,
                "old_college_name": old_college_name,
                "new_college_id": str(request.college_id) if request.college_id else None,
                "new_college_name": new_college_name
            }
        )
        await db.commit()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "college_id": str(user.college_id) if user.college_id else None,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a user (admin only).
    
    Sets the user's deleted_at timestamp and is_active to False.
    """
    from datetime import datetime
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Soft delete - set deleted_at and is_active
    user.deleted_at = datetime.utcnow()
    user.is_active = False
    await db.commit()
    
    # Create audit log
    await create_audit_log(
        db=db,
        action="USER_DELETE",
        performed_by=current_user.id,
        target_type="User",
        target_id=str(user.id),
        college_id=user.college_id,
        metadata={
            "user_email": user.email,
            "user_role": user.role
        }
    )
    await db.commit()
    
    return None


# =============================================================================
# AUDIT LOGS (ADMIN)
# =============================================================================

@router.get("/audit-logs")
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = None,
    performed_by: Optional[UUID] = None,
    target_type: Optional[str] = None,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """List audit logs (admin only)."""
    
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
    dependencies=[Depends(require_roles("admin"))]
)
async def get_platform_analytics(db: AsyncSession = Depends(get_db)):
    """Get platform-wide analytics (admin only)."""
    return await AnalyticsService.get_platform_analytics(db)
