"""
College admin router.
Handles college-level administrative operations for college admins.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment, SlideActivity, AuditLog
from app.shared.permissions import require_roles, require_permission, verify_college_access
from app.shared.audit_helpers import create_audit_log
from app.accounts.dependencies import get_current_user
from app.accounts.utils import hash_password
from app.core.feature_guard import PLATFORM_FEATURES, FeatureGuard
from app.modules.roles.college_admin.schemas import (
    UserCreateRequest, UserUpdateRequest, UserResponse, UserListResponse, UserBulkCreateRequest,
    AuditLogResponse, AuditLogListResponse, BulkUploadResponse
)


router = APIRouter(
    prefix="/college-admin",
    tags=["College Admin"]
)


# =============================================================================
# COLLEGE ADMIN DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def college_admin_dashboard(
    include_advanced: bool = Query(False, description="Include advanced analytics"),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get college admin dashboard data with analytics."""
    college_id = current_user.college_id
    
    # Check if user has a college assigned
    if college_id is None:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={
                "detail": "No college assigned to this user. Please contact the platform administrator to assign a college to your account.",
                "error_code": "NO_COLLEGE_ASSIGNED"
            }
        )
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    week_ago = today_start - timedelta(days=7)
    
    # Get college info
    college_result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = college_result.scalar_one_or_none()
    
    # User counts
    user_counts = {}
    roles = ["staff", "faculty", "trainer", "student"]
    for role in roles:
        result = await db.execute(
            select(func.count(User.id)).where(
                User.college_id == college_id,
                User.role == role,
                User.is_active == True,
                User.deleted_at == None
            )
        )
        user_counts[role] = result.scalar()
    
    # Class count
    classes_result = await db.execute(
        select(func.count(Class.id)).where(
            Class.college_id == college_id,
            Class.is_archived == False,
            Class.deleted_at == None
        )
    )
    class_count = classes_result.scalar()
    
    # Active sessions today
    active_sessions_today_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.college_id == college_id,
            SessionModel.is_active == True,
            SessionModel.start_time >= today_start
        )
    )
    active_sessions_today = active_sessions_today_result.scalar()
    
    # Total sessions in last 7 days
    sessions_week_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.college_id == college_id,
            SessionModel.created_at >= week_ago
        )
    )
    sessions_last_7_days = sessions_week_result.scalar()
    
    # Calculate student participation rate (last 7 days)
    # Get unique students who had slide activity in last 7 days
    active_students_result = await db.execute(
        select(func.count(func.distinct(SlideActivity.student_id)))
        .select_from(SlideActivity)
        .join(SessionModel, SlideActivity.session_id == SessionModel.id)
        .where(
            SessionModel.college_id == college_id,
            SlideActivity.last_seen_at >= week_ago
        )
    )
    active_students = active_students_result.scalar() or 0
    total_students = user_counts.get("student", 0)
    participation_rate = round((active_students / total_students * 100), 1) if total_students > 0 else 0
    
    # Build base response
    response = {
        "college": {
            "id": str(college.id),
            "name": college.name,
            "code": college.code
        } if college else None,
        "stats": {
            "staff": user_counts.get("staff", 0),
            "faculty": user_counts.get("faculty", 0),
            "trainer": user_counts.get("trainer", 0),
            "student": user_counts.get("student", 0),
            "total_users": sum(user_counts.values()),
            "classes": class_count,
            "sessions_today": active_sessions_today,
            "sessions_last_7_days": sessions_last_7_days,
            "participation_rate": participation_rate
        }
    }
    
    # Check if advanced analytics should be included
    # Either explicitly requested or if advanced_analytics is enabled for the college
    guard = FeatureGuard(db, current_user)
    try:
        college_features = await guard._load_college_features()
        has_advanced = college_features.get("college_analytics", False) or college_features.get("advanced_reports", False)
    except:
        has_advanced = False
    
    if include_advanced or has_advanced:
        # Get daily session trends for last 7 days
        daily_trends = []
        for i in range(6, -1, -1):
            day = today_start - timedelta(days=i)
            day_end = day + timedelta(days=1)
            
            # Sessions that day
            day_sessions_result = await db.execute(
                select(func.count(SessionModel.id)).where(
                    SessionModel.college_id == college_id,
                    SessionModel.created_at >= day,
                    SessionModel.created_at < day_end
                )
            )
            day_sessions = day_sessions_result.scalar()
            
            # Unique students active that day
            day_students_result = await db.execute(
                select(func.count(func.distinct(SlideActivity.student_id))).select_from(
                    SlideActivity.join(SessionModel).where(
                        SessionModel.college_id == college_id,
                        SlideActivity.last_seen_at >= day,
                        SlideActivity.last_seen_at < day_end
                    )
                )
            )
            day_students = day_students_result.scalar() or 0
            
            daily_trends.append({
                "date": day.strftime("%Y-%m-%d"),
                "sessions": day_sessions,
                "active_students": day_students
            })
        
        response["analytics"] = {
            "daily_trends": daily_trends,
            "period": "last_7_days"
        }
    
    return response


# =============================================================================
# USER MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

VALID_COLLEGE_ROLES = ["staff", "faculty", "trainer", "student"]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_college_user(
    request: UserCreateRequest,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user in the college (college admin only)."""
    # Verify role is valid for college
    if request.role not in VALID_COLLEGE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_COLLEGE_ROLES)}"
        )
    
    # Check if college is active
    college_result = await db.execute(
        select(College).where(College.id == current_user.college_id)
    )
    college = college_result.scalar_one_or_none()
    if not college or not college.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create users. College is not active."
        )
    
    # Check if email exists
    existing = await db.execute(
        select(User).where(User.email == request.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create user
    user = User(
        email=request.email,
        full_name=request.name,
        password_hash=hash_password(request.password),
        role=request.role,
        college_id=current_user.college_id,
        is_active=request.is_active
    )
    db.add(user)
    
    # Create audit log
    audit_log = await create_audit_log(
        db=db,
        action="USER_CREATE",
        performed_by=current_user.id,
        target_type="User",
        target_id=None,  # Will be set after commit
        college_id=current_user.college_id,
        metadata={"email": request.email, "role": request.role, "name": request.name}
    )
    
    await db.commit()
    await db.refresh(user)
    
    # Update audit log with target ID
    audit_log.target_id = str(user.id)
    await db.commit()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }


@router.get("/users", response_model=UserListResponse)
async def list_college_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List users in the college (college admin only)."""
    query = select(User).where(
        User.college_id == current_user.college_id,
        User.deleted_at == None  # Exclude soft-deleted users
    )
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term)
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
                "name": u.full_name,
                "role": u.role,
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


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_college_user(
    user_id: UUID,
    request: UserUpdateRequest,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a user in the college (college admin only)."""
    # Get user
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.college_id == current_user.college_id
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your college"
        )
    
    # Prevent changing role to/from admin or college_admin
    if request.role is not None:
        if request.role not in VALID_COLLEGE_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(VALID_COLLEGE_ROLES)}"
            )
        if user.role in ["admin", "college_admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of admin users"
            )
        if request.role in ["admin", "college_admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set admin or college_admin role"
            )
    
    # Track changes for audit
    changes = {}
    
    if request.name is not None and request.name != user.full_name:
        changes["name"] = {"old": user.full_name, "new": request.name}
        user.full_name = request.name
    if request.role is not None and request.role != user.role:
        changes["role"] = {"old": user.role, "new": request.role}
        user.role = request.role
    if request.is_active is not None and request.is_active != user.is_active:
        changes["is_active"] = {"old": user.is_active, "new": request.is_active}
        user.is_active = request.is_active
    
    user.updated_at = datetime.utcnow()
    
    # Create audit log
    if changes:
        await create_audit_log(
            db=db,
            action="USER_UPDATE",
            performed_by=current_user.id,
            target_type="User",
            target_id=str(user.id),
            college_id=current_user.college_id,
            metadata=changes
        )
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_college_user(
    user_id: UUID,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a user in the college (college admin only)."""
    # Get user
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.college_id == current_user.college_id
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your college"
        )
    
    # Prevent deleting admin users
    if user.role in ["admin", "college_admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    # Soft delete
    user.deleted_at = datetime.utcnow()
    user.is_active = False  # Also deactivate
    user.updated_at = datetime.utcnow()
    
    # Create audit log
    await create_audit_log(
        db=db,
        action="USER_DELETE",
        performed_by=current_user.id,
        target_type="User",
        target_id=str(user.id),
        college_id=current_user.college_id,
        metadata={"email": user.email, "role": user.role}
    )
    
    await db.commit()


@router.post("/users/bulk", response_model=List[UserResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_college_users(
    request: UserBulkCreateRequest,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Bulk create users in the college (college admin only)."""
    # Verify college is active
    college_result = await db.execute(
        select(College).where(College.id == current_user.college_id)
    )
    college = college_result.scalar_one_or_none()
    if not college or not college.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create users. College is not active."
        )
    
    created_users = []
    errors = []
    
    for idx, user_data in enumerate(request.users):
        # Validate role
        if user_data.role not in VALID_COLLEGE_ROLES:
            errors.append({"index": idx, "error": f"Invalid role: {user_data.role}"})
            continue
        
        # Check if email exists
        existing = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing.scalar_one_or_none():
            errors.append({"index": idx, "error": f"Email already exists: {user_data.email}"})
            continue
        
        # Create user
        user = User(
            email=user_data.email,
            full_name=user_data.name,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            college_id=current_user.college_id,
            is_active=user_data.is_active
        )
        db.add(user)
        created_users.append(user)
    
    # Create audit log
    await create_audit_log(
        db=db,
        action="USER_BULK_CREATE",
        performed_by=current_user.id,
        target_type="User",
        target_id=None,
        college_id=current_user.college_id,
        metadata={"count": len(created_users), "errors": errors}
    )
    
    await db.commit()
    
    # Refresh all users
    for user in created_users:
        await db.refresh(user)
    
    # If there were errors, include them in response
    if errors and not created_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No users created. Errors: {errors}"
        )
    
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        }
        for u in created_users
    ]


# =============================================================================
# =============================================================================
# CLASS MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

@router.post("/classes")
async def create_class(
    name: str,
    department: Optional[str] = None,
    academic_year: Optional[str] = None,
    faculty_id: Optional[UUID] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new class (college admin only)."""
    # Verify faculty belongs to college if provided
    if faculty_id:
        faculty_result = await db.execute(
            select(User).where(
                User.id == faculty_id,
                User.college_id == current_user.college_id,
                User.role == "faculty"
            )
        )
        if not faculty_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faculty member not found in your college"
            )
    
    # Create class
    class_obj = Class(
        name=name,
        department=department,
        academic_year=academic_year,
        faculty_id=faculty_id,
        college_id=current_user.college_id,
        is_active=True,
        is_archived=False
    )
    db.add(class_obj)
    await db.commit()
    await db.refresh(class_obj)
    
    return {
        "id": str(class_obj.id),
        "name": class_obj.name,
        "department": class_obj.department,
        "faculty_id": str(class_obj.faculty_id) if class_obj.faculty_id else None,
        "college_id": str(class_obj.college_id)
    }


@router.get("/classes")
async def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = None,
    faculty_id: Optional[UUID] = None,
    include_archived: bool = False,
    current_user: User = Depends(require_roles("college_admin", "faculty", "staff")),
    db: AsyncSession = Depends(get_db)
):
    """List classes in the college."""
    query = select(Class).where(Class.college_id == current_user.college_id)
    
    if not include_archived:
        query = query.where(Class.is_archived == False)
    if department:
        query = query.where(Class.department == department)
    if faculty_id:
        query = query.where(Class.faculty_id == faculty_id)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Class.created_at.desc())
    result = await db.execute(query)
    classes = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "department": c.department,
                "academic_year": c.academic_year,
                "faculty_id": str(c.faculty_id) if c.faculty_id else None,
                "is_archived": c.is_archived
            }
            for c in classes
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/classes/{class_id}")
async def get_class(
    class_id: UUID,
    current_user: User = Depends(require_roles("college_admin", "faculty", "staff", "trainer", "student")),
    db: AsyncSession = Depends(get_db)
):
    """Get class details."""
    result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.college_id == current_user.college_id
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Get enrollment count
    enrollment_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.class_id == class_id)
    )
    enrollment_count = enrollment_result.scalar()
    
    return {
        "id": str(class_obj.id),
        "name": class_obj.name,
        "department": class_obj.department,
        "academic_year": class_obj.academic_year,
        "faculty_id": str(class_obj.faculty_id) if class_obj.faculty_id else None,
        "is_archived": class_obj.is_archived,
        "enrollment_count": enrollment_count
    }


@router.patch("/classes/{class_id}")
async def update_class(
    class_id: UUID,
    name: Optional[str] = None,
    department: Optional[str] = None,
    academic_year: Optional[str] = None,
    faculty_id: Optional[UUID] = None,
    is_archived: Optional[bool] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a class (college admin only)."""
    result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.college_id == current_user.college_id
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Verify faculty belongs to college if provided
    if faculty_id:
        faculty_result = await db.execute(
            select(User).where(
                User.id == faculty_id,
                User.college_id == current_user.college_id,
                User.role == "faculty"
            )
        )
        if not faculty_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faculty member not found in your college"
            )
    
    if name is not None:
        class_obj.name = name
    if department is not None:
        class_obj.department = department
    if academic_year is not None:
        class_obj.academic_year = academic_year
    if faculty_id is not None:
        class_obj.faculty_id = faculty_id
    if is_archived is not None:
        class_obj.is_archived = is_archived
    
    class_obj.updated_at = datetime.utcnow()
    
    # Audit log
    await create_audit_log(
        db=db,
        action="CLASS_UPDATE",
        performed_by=current_user.id,
        target_type="Class",
        target_id=str(class_id),
        college_id=current_user.college_id,
        metadata={"name": name}
    )
    
    await db.commit()
    await db.refresh(class_obj)
    
    return {
        "id": str(class_obj.id),
        "name": class_obj.name,
        "department": class_obj.department,
        "academic_year": class_obj.academic_year,
        "faculty_id": str(class_obj.faculty_id) if class_obj.faculty_id else None,
        "is_archived": class_obj.is_archived
    }


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: UUID,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a class (college admin only)."""
    result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.college_id == current_user.college_id
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Soft delete
    class_obj.deleted_at = datetime.utcnow()
    class_obj.is_archived = True
    class_obj.updated_at = datetime.utcnow()
    
    # Audit log
    await create_audit_log(
        db=db,
        action="CLASS_DELETE",
        performed_by=current_user.id,
        target_type="Class",
        target_id=str(class_id),
        college_id=current_user.college_id,
        metadata={"name": class_obj.name}
    )
    
    await db.commit()


# =============================================================================
# SESSION MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

@router.get("/sessions")
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    class_id: Optional[UUID] = None,
    faculty_id: Optional[UUID] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all sessions in the college with aggregated metrics."""
    from app.models.models import Session as SessionModel, SlideActivity
    
    college_id = current_user.college_id
    
    # Build base query
    query = select(SessionModel).where(SessionModel.college_id == college_id)
    
    if class_id:
        query = query.where(SessionModel.class_id == class_id)
    if faculty_id:
        query = query.where(SessionModel.faculty_id == faculty_id)
    
    # Date filtering
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.where(SessionModel.created_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.where(SessionModel.created_at <= end_dt)
        except ValueError:
            pass
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(SessionModel.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Build response with aggregated metrics
    items = []
    for session in sessions:
        # Get class info
        class_result = await db.execute(
            select(Class).where(Class.id == session.class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        
        # Get faculty info
        faculty_result = await db.execute(
            select(User).where(User.id == session.faculty_id)
        )
        faculty = faculty_result.scalar_one_or_none()
        
        # Get attendance (unique students who engaged)
        attendance_result = await db.execute(
            select(func.count(func.distinct(SlideActivity.student_id))).where(
                SlideActivity.session_id == session.id
            )
        )
        attendance_count = attendance_result.scalar() or 0
        
        # Get total enrollments for this class
        enrollment_result = await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.class_id == session.class_id
            )
        )
        total_enrolled = enrollment_result.scalar() or 0
        
        # Calculate attendance percentage
        attendance_rate = round((attendance_count / total_enrolled * 100), 1) if total_enrolled > 0 else 0
        
        items.append({
            "id": str(session.id),
            "class_id": str(session.class_id),
            "class_name": class_obj.name if class_obj else "Unknown",
            "faculty_id": str(session.faculty_id) if session.faculty_id else None,
            "faculty_name": faculty.full_name if faculty else "Unknown",
            "start_time": session.start_time.isoformat() if session.start_time else None,
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "is_active": session.is_active,
            "created_at": session.created_at.isoformat(),
            "attendance_count": attendance_count,
            "total_enrolled": total_enrolled,
            "attendance_rate": attendance_rate
        })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get session details with aggregated metrics (no student-level data)."""
    from app.models.models import Session as SessionModel, SlideActivity
    
    # Get session
    result = await db.execute(
        select(SessionModel).where(
            SessionModel.id == session_id,
            SessionModel.college_id == current_user.college_id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get class info
    class_result = await db.execute(
        select(Class).where(Class.id == session.class_id)
    )
    class_obj = class_result.scalar_one_or_none()
    
    # Get faculty info
    faculty_result = await db.execute(
        select(User).where(User.id == session.faculty_id)
    )
    faculty = faculty_result.scalar_one_or_none()
    
    # Get attendance stats
    attendance_result = await db.execute(
        select(
            func.count(func.distinct(SlideActivity.student_id)).label('active_students'),
            func.count(SlideActivity.id).label('total_activities')
        ).where(SlideActivity.session_id == session.id)
    )
    attendance_stats = attendance_result.one()
    
    # Get total enrollments
    enrollment_result = await db.execute(
        select(func.count(Enrollment.id)).where(
            Enrollment.class_id == session.class_id
        )
    )
    total_enrolled = enrollment_result.scalar() or 0
    
    # Calculate attendance rate
    attendance_rate = round((attendance_stats.active_students / total_enrolled * 100), 1) if total_enrolled > 0 else 0
    
    return {
        "id": str(session.id),
        "class_id": str(session.class_id),
        "class_name": class_obj.name if class_obj else "Unknown",
        "faculty_id": str(session.faculty_id) if session.faculty_id else None,
        "faculty_name": faculty.full_name if faculty else "Unknown",
        "faculty_email": faculty.email if faculty else None,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "is_active": session.is_active,
        "created_at": session.created_at.isoformat(),
        "metrics": {
            "total_enrolled": total_enrolled,
            "active_students": attendance_stats.active_students or 0,
            "total_activities": attendance_stats.total_activities or 0,
            "attendance_rate": attendance_rate
        }
    }


# =============================================================================
# REPORTS & EXPORT (COLLEGE ADMIN)
# =============================================================================

@router.get("/reports/attendance")
async def get_attendance_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[UUID] = Query(None, description="Filter by class"),
    faculty_id: Optional[UUID] = Query(None, description="Filter by faculty"),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get attendance report for the college (feature-gated)."""
    from app.models.models import Session as SessionModel, SlideActivity
    
    # Check if advanced reports feature is enabled
    guard = FeatureGuard(db, current_user)
    try:
        await guard.check_feature("advanced_reports")
    except HTTPException:
        # Try college_analytics as fallback
        try:
            await guard.check_feature("college_analytics")
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Advanced reports feature is not enabled for your college"
            )
    
    college_id = current_user.college_id
    
    # Build date filters
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            pass
    
    # Build query for sessions
    query = select(SessionModel).where(SessionModel.college_id == college_id)
    
    if class_id:
        query = query.where(SessionModel.class_id == class_id)
    if faculty_id:
        query = query.where(SessionModel.faculty_id == faculty_id)
    if start_dt:
        query = query.where(SessionModel.created_at >= start_dt)
    if end_dt:
        query = query.where(SessionModel.created_at <= end_dt)
    
    query = query.order_by(SessionModel.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Build attendance data
    items = []
    for session in sessions:
        # Get class info
        class_result = await db.execute(
            select(Class).where(Class.id == session.class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        
        # Get faculty info
        faculty_result = await db.execute(
            select(User).where(User.id == session.faculty_id)
        )
        faculty = faculty_result.scalar_one_or_none()
        
        # Get attendance
        attendance_result = await db.execute(
            select(func.count(func.distinct(SlideActivity.student_id))).where(
                SlideActivity.session_id == session.id
            )
        )
        attendance_count = attendance_result.scalar() or 0
        
        # Get enrollments
        enrollment_result = await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.class_id == session.class_id
            )
        )
        total_enrolled = enrollment_result.scalar() or 0
        
        attendance_rate = round((attendance_count / total_enrolled * 100), 1) if total_enrolled > 0 else 0
        
        items.append({
            "session_id": str(session.id),
            "class_name": class_obj.name if class_obj else "Unknown",
            "faculty_name": faculty.full_name if faculty else "Unknown",
            "date": session.created_at.strftime("%Y-%m-%d"),
            "time": session.start_time.strftime("%H:%M") if session.start_time else "-",
            "enrolled": total_enrolled,
            "attended": attendance_count,
            "rate": attendance_rate
        })
    
    # Calculate summary
    total_enrolled_sum = sum(item["enrolled"] for item in items)
    total_attended_sum = sum(item["attended"] for item in items)
    overall_rate = round((total_attended_sum / total_enrolled_sum * 100), 1) if total_enrolled_sum > 0 else 0
    
    return {
        "items": items,
        "summary": {
            "total_sessions": len(items),
            "total_enrolled": total_enrolled_sum,
            "total_attended": total_attended_sum,
            "overall_attendance_rate": overall_rate
        },
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
            "class_id": str(class_id) if class_id else None,
            "faculty_id": str(faculty_id) if faculty_id else None
        }
    }


@router.get("/reports/attendance/export")
async def export_attendance_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    class_id: Optional[UUID] = Query(None),
    faculty_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Export attendance report as CSV (feature-gated)."""
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    # Check feature
    guard = FeatureGuard(db, current_user)
    try:
        await guard.check_feature("advanced_reports")
    except HTTPException:
        try:
            await guard.check_feature("college_analytics")
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Advanced reports feature is not enabled for your college"
            )
    
    college_id = current_user.college_id
    
    # Build filters similar to GET endpoint
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    query = select(SessionModel).where(SessionModel.college_id == college_id)
    if class_id:
        query = query.where(SessionModel.class_id == class_id)
    if faculty_id:
        query = query.where(SessionModel.faculty_id == faculty_id)
    if start_dt:
        query = query.where(SessionModel.created_at >= start_dt)
    if end_dt:
        query = query.where(SessionModel.created_at <= end_dt)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Build CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Time", "Class", "Faculty", "Enrolled", "Attended", "Attendance Rate"])
    
    for session in sessions:
        class_result = await db.execute(select(Class).where(Class.id == session.class_id))
        class_obj = class_result.scalar_one_or_none()
        
        faculty_result = await db.execute(select(User).where(User.id == session.faculty_id))
        faculty = faculty_result.scalar_one_or_none()
        
        attendance_result = await db.execute(
            select(func.count(func.distinct(SlideActivity.student_id))).where(
                SlideActivity.session_id == session.id
            )
        )
        attendance_count = attendance_result.scalar() or 0
        
        enrollment_result = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.class_id == session.class_id)
        )
        total_enrolled = enrollment_result.scalar() or 0
        
        rate = round((attendance_count / total_enrolled * 100), 1) if total_enrolled > 0 else 0
        
        writer.writerow([
            session.created_at.strftime("%Y-%m-%d"),
            session.start_time.strftime("%H:%M") if session.start_time else "",
            class_obj.name if class_obj else "",
            faculty.full_name if faculty else "",
            total_enrolled,
            attendance_count,
            f"{rate}%"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )


# =============================================================================
# COLLEGE SETTINGS
# =============================================================================

# Default settings schema
DEFAULT_COLLEGE_SETTINGS = {
    "attendance_threshold": 75,  # Minimum attendance % to pass
    "max_violations": 5,       # Max violations before action
    "session_timeout": 30,     # Session timeout in minutes
    "auto_archive_classes": True,  # Auto-archive old classes
    "require_approval": False,    # Require approval for enrollments
}

@router.get("/settings")
async def get_college_settings(
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get college settings."""
    college_id = current_user.college_id
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    # Merge defaults with saved settings
    settings = DEFAULT_COLLEGE_SETTINGS.copy()
    if college.settings:
        settings.update(college.settings)
    
    return settings


@router.put("/settings")
async def update_college_settings(
    attendance_threshold: Optional[int] = Query(None, ge=0, le=100, description="Minimum attendance %"),
    max_violations: Optional[int] = Query(None, ge=0, description="Max violations"),
    session_timeout: Optional[int] = Query(None, ge=5, le=120, description="Session timeout minutes"),
    auto_archive_classes: Optional[bool] = Query(None, description="Auto-archive old classes"),
    require_approval: Optional[bool] = Query(None, description="Require enrollment approval"),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update college settings."""
    college_id = current_user.college_id
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    # Build settings dict
    new_settings = college.settings.copy() if college.settings else {}
    
    if attendance_threshold is not None:
        new_settings["attendance_threshold"] = attendance_threshold
    if max_violations is not None:
        new_settings["max_violations"] = max_violations
    if session_timeout is not None:
        new_settings["session_timeout"] = session_timeout
    if auto_archive_classes is not None:
        new_settings["auto_archive_classes"] = auto_archive_classes
    if require_approval is not None:
        new_settings["require_approval"] = require_approval
    
    college.settings = new_settings
    college.updated_at = datetime.utcnow()
    
    # Audit log
    await create_audit_log(
        db=db,
        action="COLLEGE_SETTINGS_UPDATE",
        performed_by=current_user.id,
        target_type="College",
        target_id=str(college_id),
        college_id=college_id,
        metadata={"updated_fields": list(new_settings.keys())}
    )
    
    await db.commit()
    
    # Return merged settings
    settings = DEFAULT_COLLEGE_SETTINGS.copy()
    settings.update(new_settings)
    
    return settings


# =============================================================================
# FEATURE MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

VALID_ROLES = ["staff", "faculty", "trainer", "student"]

# Feature metadata for display
FEATURE_METADATA = {
    "attendance_tracking": {"name": "Attendance Tracking", "description": "Track student attendance in classes"},
    "ai_notes": {"name": "AI Notes", "description": "AI-powered note taking and summarization"},
    "placement_module": {"name": "Placement Module", "description": "Manage placements and internships"},
    "assessment_module": {"name": "Assessment Module", "description": "Create and manage assessments"},
    "advanced_reports": {"name": "Advanced Reports", "description": "Detailed analytics and reporting"},
    "live_session_lock": {"name": "Live Session Lock", "description": "Lock live sessions during class"},
    "student_portal": {"name": "Student Portal", "description": "Access to student portal"},
    "faculty_portal": {"name": "Faculty Portal", "description": "Access to faculty portal"},
    "staff_portal": {"name": "Staff Portal", "description": "Access to staff portal"},
    "trainer_portal": {"name": "Trainer Portal", "description": "Access to trainer portal"},
    "college_analytics": {"name": "College Analytics", "description": "College-level analytics dashboard"},
}


@router.get("/features")
async def get_college_features(
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get all features available for the college (college-level enabled features)."""
    from app.models.models import CollegeFeature
    from sqlalchemy import select
    
    college_id = current_user.college_id
    
    # Get college-level features
    result = await db.execute(
        select(CollegeFeature).where(CollegeFeature.college_id == college_id)
    )
    college_features = result.scalars().all()
    
    # Build response with metadata
    items = []
    for feature_key in PLATFORM_FEATURES:
        # Find if this feature is enabled for the college
        college_feature = next((f for f in college_features if f.feature_key == feature_key), None)
        is_enabled = college_feature.is_enabled if college_feature else False
        metadata = FEATURE_METADATA.get(feature_key, {"name": feature_key, "description": ""})
        
        items.append({
            "feature_key": feature_key,
            "name": metadata["name"],
            "description": metadata["description"],
            "is_enabled": is_enabled
        })
    
    return {
        "items": items,
        "total": len(items)
    }


@router.get("/features/roles")
async def get_role_features(
    role: Optional[str] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get role feature permissions for the college (college admin only)."""
    from app.models.models import RoleFeaturePermission, CollegeFeature
    from sqlalchemy import select
    
    college_id = current_user.college_id
    
    # Get college-level features to know what's enabled
    college_features_result = await db.execute(
        select(CollegeFeature).where(CollegeFeature.college_id == college_id)
    )
    college_features = college_features_result.scalars().all()
    enabled_college_features = {f.feature_key: f.is_enabled for f in college_features}
    
    # Get role permissions
    query = select(RoleFeaturePermission).where(
        RoleFeaturePermission.college_id == college_id
    )
    if role:
        query = query.where(RoleFeaturePermission.role == role)
    
    result = await db.execute(query)
    permissions = result.scalars().all()
    
    # Create lookup
    existing_perms = {
        (p.role, p.feature_key): p.is_enabled 
        for p in permissions
    }
    
    # Build response
    items = []
    for r in VALID_ROLES:
        if role and r != role:
            continue
        for feature_key in PLATFORM_FEATURES:
            # Role can only access features enabled at college level
            college_enabled = enabled_college_features.get(feature_key, False)
            role_enabled = existing_perms.get((r, feature_key), False) and college_enabled
            
            items.append({
                "role": r,
                "feature_key": feature_key,
                "is_enabled": role_enabled,
                "college_feature_enabled": college_enabled  # Inform college admin what's available
            })
    
    return {
        "items": items,
        "total": len(items)
    }


@router.patch("/features/roles")
async def toggle_role_feature(
    role: str,
    feature_key: str,
    is_enabled: bool,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable a feature for a role (college admin only)."""
    from app.models.models import RoleFeaturePermission, CollegeFeature
    from sqlalchemy import select
    
    # Validate role
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"
        )
    
    # Validate feature key
    if feature_key not in PLATFORM_FEATURES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid feature key: {feature_key}"
        )
    
    college_id = current_user.college_id
    
    # Check if college-level feature is enabled
    college_feature_result = await db.execute(
        select(CollegeFeature).where(
            CollegeFeature.college_id == college_id,
            CollegeFeature.feature_key == feature_key
        )
    )
    college_feature = college_feature_result.scalar_one_or_none()
    
    if is_enabled and college_feature and not college_feature.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot enable '{feature_key}' because it is disabled at college level"
        )
    
    # Check if permission exists
    result = await db.execute(
        select(RoleFeaturePermission).where(
            RoleFeaturePermission.college_id == college_id,
            RoleFeaturePermission.role == role,
            RoleFeaturePermission.feature_key == feature_key
        )
    )
    permission = result.scalar_one_or_none()
    
    # Track old value for audit
    old_value = permission.is_enabled if permission else False
    
    if permission:
        permission.is_enabled = is_enabled
    else:
        permission = RoleFeaturePermission(
            college_id=college_id,
            role=role,
            feature_key=feature_key,
            is_enabled=is_enabled
        )
        db.add(permission)
    
    # Create audit log
    await create_audit_log(
        db=db,
        action="ROLE_FEATURE_TOGGLE",
        performed_by=current_user.id,
        target_type="RoleFeaturePermission",
        target_id=None,
        college_id=college_id,
        metadata={
            "role": role,
            "feature_key": feature_key,
            "old_value": old_value,
            "new_value": is_enabled
        }
    )
    
    await db.commit()
    await db.refresh(permission)
    
    return {
        "role": permission.role,
        "feature_key": permission.feature_key,
        "is_enabled": permission.is_enabled
    }


# =============================================================================
# AUDIT LOGS
# =============================================================================

@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_college_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs for the college.
    Returns paginated audit logs filtered by college.
    """
    college_id = current_user.college_id
    
    # Build query
    query = select(AuditLog).where(AuditLog.college_id == college_id)
    count_query = select(func.count()).select_from(AuditLog).where(AuditLog.college_id == college_id)
    
    # Apply filters
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
        count_query = count_query.where(AuditLog.action.ilike(f"%{action}%"))
    
    if target_type:
        query = query.where(AuditLog.target_type.ilike(f"%{target_type}%"))
        count_query = count_query.where(AuditLog.target_type.ilike(f"%{target_type}%"))
    
    if date_from:
        query = query.where(AuditLog.created_at >= date_from)
        count_query = count_query.where(AuditLog.created_at >= date_from)
    
    if date_to:
        query = query.where(AuditLog.created_at <= date_to)
        count_query = count_query.where(AuditLog.created_at <= date_to)
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Get user info for performed_by
    user_ids = [log.performed_by for log in logs]
    users_map = {}
    if user_ids:
        users_result = await db.execute(
            select(User.id, User.full_name).where(User.id.in_(user_ids))
        )
        for user in users_result.all():
            users_map[str(user.id)] = user.full_name
    
    # Build response
    items = []
    for log in logs:
        items.append({
            "id": str(log.id),
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "metadata_json": log.metadata_json,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "performed_by": str(log.performed_by),
            "performed_by_name": users_map.get(str(log.performed_by), "Unknown")
        })
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": limit,
        "pages": pages
    }


# =============================================================================
# BULK USER UPLOAD (FILE)
# =============================================================================

ALLOWED_ROLES = ["student", "staff", "faculty", "trainer"]

@router.post("/users/bulk", response_model=BulkUploadResponse)
async def bulk_upload_users(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk upload users from CSV/Excel file.
    College admin can only create student, staff, faculty, trainer roles.
    """
    import csv
    import io
    
    college_id = current_user.college_id
    
    # Validate college
    college_result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = college_result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    if not college.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College is not active"
        )
    
    # Read file content
    content = await file.read()
    
    # Determine file type and decode
    filename = file.filename.lower()
    if filename.endswith('.csv'):
        text_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text_content))
        rows = list(reader)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported. Please convert your Excel file to CSV."
        )
    
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data found in file"
        )
    
    created_count = 0
    updated_count = 0
    failed_rows = []
    
    for idx, row in enumerate(rows, start=1):
        try:
            # Extract fields
            full_name = row.get('full_name', '').strip()
            email = row.get('email', '').strip().lower()
            role = row.get('role', '').strip().lower()
            password = row.get('password', '').strip()
            is_active_str = row.get('is_active', 'true').strip().lower()
            
            # Validation
            if not email:
                failed_rows.append({"row": idx, "email": "", "error": "Email is required"})
                continue
            
            if not full_name:
                failed_rows.append({"row": idx, "email": email, "error": "Full name is required"})
                continue
            
            if not role:
                failed_rows.append({"row": idx, "email": email, "error": "Role is required"})
                continue
            
            # Check allowed roles (college admin cannot create admin or college_admin)
            if role not in ALLOWED_ROLES:
                failed_rows.append({
                    "row": idx, 
                    "email": email, 
                    "error": f"Invalid role. Allowed: {', '.join(ALLOWED_ROLES)}"
                })
                continue
            
            if not password:
                failed_rows.append({"row": idx, "email": email, "error": "Password is required"})
                continue
            
            if len(password) < 8:
                failed_rows.append({"row": idx, "email": email, "error": "Password must be at least 8 characters"})
                continue
            
            is_active = is_active_str in ('true', '1', 'yes', 'active')
            
            # Check if user already exists in this college
            existing_result = await db.execute(
                select(User).where(
                    and_(
                        User.email == email,
                        User.college_id == college_id
                    )
                )
            )
            existing_user = existing_result.scalar_one_or_none()
            
            if existing_user:
                # Update existing user
                existing_user.full_name = full_name
                existing_user.role = role
                existing_user.is_active = is_active
                updated_count += 1
                
                # Create audit log for update
                await create_audit_log(
                    db=db,
                    action="USER_UPDATE",
                    performed_by=current_user.id,
                    target_type="User",
                    target_id=str(existing_user.id),
                    college_id=college_id,
                    metadata={"email": email, "role": role}
                )
            else:
                # Create new user
                hashed_password = hash_password(password)
                new_user = User(
                    email=email,
                    full_name=full_name,
                    role=role,
                    hashed_password=hashed_password,
                    is_active=is_active,
                    college_id=college_id
                )
                db.add(new_user)
                created_count += 1
                
                # Create audit log for create
                await create_audit_log(
                    db=db,
                    action="USER_CREATE",
                    performed_by=current_user.id,
                    target_type="User",
                    target_id=None,
                    college_id=college_id,
                    metadata={"email": email, "role": role}
                )
        
        except Exception as e:
            failed_rows.append({
                "row": idx, 
                "email": row.get('email', ''), 
                "error": str(e)
            })
    
    # Commit all changes
    await db.commit()
    
    return {
        "created_count": created_count,
        "updated_count": updated_count,
        "failed_rows": failed_rows
    }
