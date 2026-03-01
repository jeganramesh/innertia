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
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.models import User, College, Class, Session as SessionModel, Enrollment, AuditLog
from app.shared.permissions import require_roles
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
    
    try:
        # Soft delete - just set is_active to False
        college.is_active = False
        await db.commit()
        
        logger.info(f"College deactivated successfully: {college_id}")
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
