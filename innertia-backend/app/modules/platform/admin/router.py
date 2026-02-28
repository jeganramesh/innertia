"""
Platform admin router.
Handles all platform-level API endpoints.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import User
from app.shared.permissions import require_roles
from app.modules.platform.admin.schemas import (
    CollegeCreate, CollegeUpdate, CollegeResponse,
    PlatformUserCreate, PlatformUserUpdate, PlatformUserResponse,
    PlatformAnalyticsResponse, CollegeAnalyticsResponse,
    AuditLogResponse, AuditLogListResponse,
    CollegeFeatureToggle, CollegeFeatureResponse, CollegeFeatureListResponse,
    RoleFeatureResponse, RoleFeatureListResponse, RoleFeatureToggle
)
from app.modules.platform.admin.service import (
    CollegeService, PlatformUserService, AnalyticsService, AuditLogService,
    CollegeFeatureService, RoleFeatureService
)


router = APIRouter(
    prefix="/platform/admin",
    tags=["Platform Admin"]
)


# =============================================================================
# HEALTH & INFO
# =============================================================================

@router.get("/health")
async def platform_admin_health():
    """Health check for platform admin module."""
    return {"status": "healthy", "module": "platform_admin"}


# =============================================================================
# COLLEGE ENDPOINTS
# =============================================================================

@router.post(
    "/colleges",
    response_model=CollegeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def create_college(
    data: CollegeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new college (platform admin only)."""
    return await CollegeService.create_college(db, data)


@router.get("/colleges", dependencies=[Depends(require_roles("platform_admin"))])
async def list_colleges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all colleges (platform admin only)."""
    colleges, total = await CollegeService.list_colleges(
        db, skip=skip, limit=limit, is_active=is_active
    )
    return {
        "items": [CollegeResponse.model_validate(c) for c in colleges],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get(
    "/colleges/{college_id}",
    response_model=CollegeResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_college(
    college_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get college by ID (platform admin only)."""
    college = await CollegeService.get_college(db, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    return college


@router.patch(
    "/colleges/{college_id}",
    response_model=CollegeResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def update_college(
    college_id: UUID,
    data: CollegeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update college (platform admin only)."""
    college = await CollegeService.update_college(db, college_id, data)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    return college


@router.delete(
    "/colleges/{college_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def delete_college(
    college_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete (deactivate) college (platform admin only)."""
    success = await CollegeService.delete_college(db, college_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    return None


@router.get(
    "/colleges/{college_id}/analytics",
    response_model=CollegeAnalyticsResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_college_analytics(
    college_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get analytics for a specific college (platform admin only)."""
    analytics = await AnalyticsService.get_college_analytics(db, college_id)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    return analytics


# =============================================================================
# COLLEGE FEATURE ENDPOINTS
# =============================================================================

@router.get(
    "/colleges/{college_id}/features",
    response_model=CollegeFeatureListResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_college_features(
    college_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all features for a college (platform admin only)."""
    features = await CollegeFeatureService.get_college_features(db, college_id)
    
    # Build response with all platform features (including those not yet configured)
    from app.core.feature_guard import PLATFORM_FEATURES
    
    # Create a lookup for existing features
    existing_features = {f.feature_key: f.is_enabled for f in features}
    
    items = []
    for feature_key in PLATFORM_FEATURES:
        is_enabled = existing_features.get(feature_key, False)
        items.append(CollegeFeatureResponse(
            feature_key=feature_key,
            is_enabled=is_enabled
        ))
    
    return {
        "items": items,
        "total": len(items)
    }


@router.patch(
    "/colleges/{college_id}/features",
    response_model=CollegeFeatureResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def toggle_college_feature(
    college_id: UUID,
    data: CollegeFeatureToggle,
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable a feature for a college (platform admin only)."""
    try:
        feature = await CollegeFeatureService.toggle_feature(db, college_id, data)
        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
        return feature
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =============================================================================
# ROLE FEATURE PERMISSION ENDPOINTS
# =============================================================================

@router.get(
    "/colleges/{college_id}/roles/features",
    response_model=RoleFeatureListResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_role_features(
    college_id: UUID,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get role feature permissions for a college (platform admin only)."""
    permissions = await RoleFeatureService.get_role_features(db, college_id, role)
    
    # Build response with all combinations
    from app.core.feature_guard import PLATFORM_FEATURES
    from app.modules.platform.admin.service import RoleFeatureService as RFS
    
    # Create a lookup for existing permissions
    existing_perms = {
        (p.role, p.feature_key): p.is_enabled 
        for p in permissions
    }
    
    items = []
    for r in RFS.VALID_ROLES:
        for feature_key in PLATFORM_FEATURES:
            is_enabled = existing_perms.get((r, feature_key), False)
            items.append(RoleFeatureResponse(
                role=r,
                feature_key=feature_key,
                is_enabled=is_enabled
            ))
    
    return {
        "items": items,
        "total": len(items)
    }


@router.patch(
    "/colleges/{college_id}/roles/features",
    response_model=RoleFeatureResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def toggle_role_feature(
    college_id: UUID,
    data: RoleFeatureToggle,
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable a feature for a role (platform admin only)."""
    try:
        permission = await RoleFeatureService.toggle_role_feature(
            db, college_id, data.role, data.feature_key, data.is_enabled
        )
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
        return permission
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =============================================================================
# USER ENDPOINTS (PLATFORM LEVEL)
# =============================================================================

@router.post(
    "/users",
    response_model=PlatformUserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def create_user(
    data: PlatformUserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (platform admin only)."""
    try:
        user = await PlatformUserService.create_user(db, data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/users", dependencies=[Depends(require_roles("platform_admin"))])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    college_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all users with filters (platform admin only)."""
    users, total = await PlatformUserService.list_users(
        db, skip=skip, limit=limit, 
        role=role, college_id=college_id, is_active=is_active
    )
    return {
        "items": [PlatformUserResponse.model_validate(u) for u in users],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get(
    "/users/{user_id}",
    response_model=PlatformUserResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID (platform admin only)."""
    user = await PlatformUserService.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.patch(
    "/users/{user_id}",
    response_model=PlatformUserResponse,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def update_user(
    user_id: UUID,
    data: PlatformUserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update user (platform admin only)."""
    try:
        user = await PlatformUserService.update_user(db, user_id, data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete (deactivate) user (platform admin only)."""
    success = await PlatformUserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return None


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


# =============================================================================
# AUDIT LOG ENDPOINTS
# =============================================================================

@router.get(
    "/audit-logs",
    dependencies=[Depends(require_roles("platform_admin"))]
)
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[UUID] = None,
    college_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    """List audit logs with filters (platform admin only)."""
    logs, total = await AuditLogService.list_audit_logs(
        db, skip=skip, limit=limit,
        user_id=user_id, college_id=college_id,
        action=action, entity_type=entity_type,
        start_date=start_date, end_date=end_date
    )
    
    # Build response with user email
    items = []
    for log in logs:
        item = AuditLogResponse.model_validate(log)
        if log.performed_by_user and log.performed_by_user.email:
            item.user_email = log.performed_by_user.email
        items.append(item)
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }
