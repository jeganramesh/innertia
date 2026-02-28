"""
College admin router.
Handles college-level administrative operations for college admins.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment
from app.shared.permissions import require_roles, require_permission, verify_college_access
from app.accounts.dependencies import get_current_user
from app.accounts.utils import hash_password
from app.core.feature_guard import PLATFORM_FEATURES


router = APIRouter(
    prefix="/college-admin",
    tags=["College Admin"]
)


# =============================================================================
# COLLEGE ADMIN DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def college_admin_dashboard(
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get college admin dashboard data."""
    college_id = current_user.college_id
    
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
                User.is_active == True
            )
        )
        user_counts[role] = result.scalar()
    
    # Class count
    classes_result = await db.execute(
        select(func.count(Class.id)).where(
            Class.college_id == college_id,
            Class.is_archived == False
        )
    )
    class_count = classes_result.scalar()
    
    # Session count
    sessions_result = await db.execute(
        select(func.count(SessionModel.id)).where(
            SessionModel.college_id == college_id
        )
    )
    session_count = sessions_result.scalar()
    
    return {
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
            "sessions": session_count
        }
    }


# =============================================================================
# USER MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

@router.post("/users")
async def create_college_user(
    email: str,
    password: str,
    full_name: Optional[str] = None,
    role: str = "student",
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user in the college (college admin only)."""
    # Verify role is valid for college
    valid_roles = ["staff", "faculty", "trainer", "student"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
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
        college_id=current_user.college_id,
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
        "college_id": str(user.college_id),
        "is_active": user.is_active
    }


@router.get("/users")
async def list_college_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("college_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List users in the college (college admin only)."""
    query = select(User).where(User.college_id == current_user.college_id)
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
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
async def update_college_user(
    user_id: UUID,
    full_name: Optional[str] = None,
    is_active: Optional[bool] = None,
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
    
    if full_name is not None:
        user.full_name = full_name
    if is_active is not None:
        user.is_active = is_active
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active
    }


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


# =============================================================================
# FEATURE MANAGEMENT (COLLEGE ADMIN)
# =============================================================================

VALID_ROLES = ["staff", "faculty", "trainer", "student"]


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
    
    await db.commit()
    await db.refresh(permission)
    
    return {
        "role": permission.role,
        "feature_key": permission.feature_key,
        "is_enabled": permission.is_enabled
    }
