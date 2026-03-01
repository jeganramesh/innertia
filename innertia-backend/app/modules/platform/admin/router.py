"""
Platform admin API router.
Handles platform-level API endpoints for platform admins.
"""

import logging
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment, AuditLog
from app.accounts.dependencies import require_roles
from app.shared.audit_helpers import create_audit_log
from app.shared.college_helpers import has_college_admins
from app.accounts.dependencies import get_current_user
from app.modules.platform.admin.service import AnalyticsService
from app.modules.platform.admin.schemas import (
    PlatformAnalyticsResponse,
    CollegeCreate,
    CollegeUpdate,
    CollegeResponse
)

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/platform/admin",
    tags=["Platform Admin API"]
)


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get(
    "/analytics",
    response_model=PlatformAnalyticsResponse,
    dependencies=[Depends(require_roles("admin"))]
)
async def get_platform_analytics(db: AsyncSession = Depends(get_db)):
    """Get platform-wide analytics (platform admin only)."""
    return await AnalyticsService.get_platform_analytics(db)


# =============================================================================
# COLLEGE MANAGEMENT
# =============================================================================

@router.get("/colleges")
async def get_all_colleges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get all colleges (admin only)."""
    query = select(College).order_by(College.name)
    
    if is_active is not None:
        query = query.where(College.is_active == is_active)
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    colleges = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "code": c.code,
                "domain": c.domain,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in colleges
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/colleges/{college_id}")
async def get_college(
    college_id: UUID,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get college details (admin only)."""
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    return {
        "id": str(college.id),
        "name": college.name,
        "code": college.code,
        "domain": college.domain,
        "is_active": college.is_active,
        "created_at": college.created_at.isoformat() if college.created_at else None,
        "updated_at": college.updated_at.isoformat() if college.updated_at else None
    }


@router.post("/colleges", response_model=CollegeResponse, status_code=status.HTTP_201_CREATED)
async def create_college(
    college_data: CollegeCreate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new college (admin only).
    
    Optionally adds all existing users without a college to the new college.
    """
    logger.info(f"Creating college: name={college_data.name}, code={college_data.code}")
    
    try:
        # Check if college code already exists
        existing = await db.execute(
            select(College).where(College.code == college_data.code)
        )
        if existing.scalar_one_or_none():
            logger.warning(f"College code already exists: {college_data.code}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"College with code '{college_data.code}' already exists"
            )
        
        # Create the college
        new_college = College(
            name=college_data.name,
            code=college_data.code.upper(),
            domain=college_data.domain,
            is_active=True
        )
        db.add(new_college)
        await db.flush()  # Get the ID
        
        logger.info(f"College created with ID: {new_college.id}")
        
        users_added_count = 0
        
        # If requested, add existing users without a college
        if college_data.add_existing_users:
            logger.info("Adding existing users without college to the new college")
            result = await db.execute(
                select(User).where(
                    User.college_id.is_(None),
                    User.deleted_at.is_(None)
                )
            )
            users_to_add = result.scalars().all()
            
            for user in users_to_add:
                user.college_id = new_college.id
                users_added_count += 1
            
            logger.info(f"Added {users_added_count} users to college {new_college.id}")
        
        await db.commit()
        await db.refresh(new_college)
        
        return CollegeResponse(
            id=str(new_college.id),
            name=new_college.name,
            code=new_college.code,
            domain=new_college.domain,
            is_active=new_college.is_active,
            created_at=new_college.created_at.isoformat() if new_college.created_at else None,
            updated_at=new_college.updated_at.isoformat() if new_college.updated_at else None,
            users_added_count=users_added_count
        )
        
    except IntegrityError as e:
        logger.error(f"Database integrity error creating college: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="College with this code already exists"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating college: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create college"
        )


@router.patch("/colleges/{college_id}", response_model=CollegeResponse)
async def update_college(
    college_id: UUID,
    college_data: CollegeUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a college (admin only).
    """
    logger.info(f"Updating college: {college_id}")
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        logger.warning(f"College not found: {college_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    try:
        # Update fields if provided
        if college_data.name is not None:
            college.name = college_data.name
        if college_data.code is not None:
            # Check if new code conflicts with existing college
            existing = await db.execute(
                select(College).where(
                    College.code == college_data.code.upper(),
                    College.id != college_id
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"College with code '{college_data.code}' already exists"
                )
            college.code = college_data.code.upper()
        if college_data.domain is not None:
            college.domain = college_data.domain
        if college_data.is_active is not None:
            college.is_active = college_data.is_active
        
        await db.commit()
        await db.refresh(college)
        
        logger.info(f"College updated successfully: {college_id}")
        
        return CollegeResponse(
            id=str(college.id),
            name=college.name,
            code=college.code,
            domain=college.domain,
            is_active=college.is_active,
            created_at=college.created_at.isoformat() if college.created_at else None,
            updated_at=college.updated_at.isoformat() if college.updated_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating college: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update college"
        )


@router.patch("/colleges/{college_id}/toggle", response_model=CollegeResponse)
async def toggle_college_status(
    college_id: UUID,
    toggle_data: dict,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle college active status (admin only).
    
    Accepts: { "is_active": boolean }
    """
    logger.info(f"Toggling college status: {college_id}")
    
    # Get is_active from request body
    is_active = toggle_data.get("is_active")
    if is_active is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="is_active field is required"
        )
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        logger.warning(f"College not found: {college_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    # Check if trying to deactivate a college with users but no college admin
    if is_active is False and college.is_active == True:
        # Check if college has any users
        users_result = await db.execute(
            select(func.count(User.id)).where(
                User.college_id == college_id,
                User.deleted_at.is_(None)
            )
        )
        user_count = users_result.scalar() or 0
        
        if user_count > 0:
            # Check if college has at least one college admin
            has_admin = await has_college_admins(db, college_id)
            if not has_admin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate college with users but no college admin. Please assign a college admin first."
                )
    
    try:
        # Store old value for audit
        old_is_active = college.is_active
        college.is_active = is_active
        
        # If deactivating college, also deactivate all associated users
        deactivated_user_count = 0
        if not is_active and old_is_active:
            result = await db.execute(
                update(User)
                .where(
                    User.college_id == college_id,
                    User.is_active == True,
                    User.deleted_at.is_(None)
                )
                .values(is_active=False)
            )
            deactivated_user_count = result.rowcount
            logger.info(f"Deactivated {deactivated_user_count} users for college: {college_id}")
        
        await db.commit()
        await db.refresh(college)
        
        # Create audit log entry
        await create_audit_log(
            db=db,
            action="COLLEGE_STATUS_TOGGLE",
            performed_by=current_user.id,
            target_type="College",
            target_id=str(college.id),
            college_id=college.id,
            metadata={
                "college_name": college.name,
                "old_is_active": old_is_active,
                "new_is_active": is_active,
                "deactivated_user_count": deactivated_user_count if not is_active and old_is_active else 0
            }
        )
        await db.commit()
        
        status_word = "activated" if is_active else "deactivated"
        logger.info(f"College {status_word} successfully: {college_id}")
        
        return CollegeResponse(
            id=str(college.id),
            name=college.name,
            code=college.code,
            domain=college.domain,
            is_active=college.is_active,
            created_at=college.created_at.isoformat() if college.created_at else None,
            updated_at=college.updated_at.isoformat() if college.updated_at else None
        )
        
    except Exception as e:
        logger.error(f"Error toggling college status: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle college status"
        )


@router.delete("/colleges/{college_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_college(
    college_id: UUID,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a college (admin only).
    
    This soft-deletes the college by setting is_active to False.
    """
    logger.info(f"Deactivating college: {college_id}")
    
    result = await db.execute(
        select(College).where(College.id == college_id)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        logger.warning(f"College not found: {college_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    # Check if college has users but no college admin
    users_result = await db.execute(
        select(func.count(User.id)).where(
            User.college_id == college_id,
            User.deleted_at.is_(None)
        )
    )
    user_count = users_result.scalar() or 0
    
    if user_count > 0:
        # Check if college has at least one college admin
        has_admin = await has_college_admins(db, college_id)
        if not has_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate college with users but no college admin. Please assign a college admin first."
            )
    
    try:
        # Soft delete - just set is_active to False
        college.is_active = False
        
        # Also deactivate all associated users
        result = await db.execute(
            update(User)
            .where(
                User.college_id == college_id,
                User.is_active == True,
                User.deleted_at.is_(None)
            )
            .values(is_active=False)
        )
        deactivated_user_count = result.rowcount
        
        await db.commit()
        
        logger.info(f"College deactivated successfully: {college_id}, deactivated {deactivated_user_count} users")
        return None
        
    except Exception as e:
        logger.error(f"Error deactivating college: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate college"
        )


# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.get("/users")
async def get_all_platform_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get all platform users (admin only)."""
    query = select(User).where(User.deleted_at.is_(None))
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
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
                "college_id": str(u.college_id) if u.college_id else None,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
