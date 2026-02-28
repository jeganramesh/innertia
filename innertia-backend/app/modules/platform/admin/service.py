"""
Platform admin service layer.
Handles business logic for platform-level operations.
"""

from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    User, College, Class, Session as SessionModel, 
    Enrollment, AuditLog, RoleEnum, CollegeFeature, RoleFeaturePermission
)
from app.modules.platform.admin.schemas import (
    CollegeCreate, CollegeUpdate,
    PlatformUserCreate, PlatformUserUpdate,
    PlatformAnalyticsResponse, CollegeAnalyticsResponse,
    AuditLogListResponse, CollegeFeatureToggle
)
from app.accounts.utils import hash_password
from app.core.feature_guard import PLATFORM_FEATURES


# =============================================================================
# COLLEGE OPERATIONS
# =============================================================================

class CollegeService:
    """Service for college operations."""
    
    @staticmethod
    async def create_college(db: AsyncSession, data: CollegeCreate) -> College:
        """Create a new college."""
        college = College(
            name=data.name,
            code=data.code,
            domain=data.domain,
            is_active=data.is_active
        )
        db.add(college)
        await db.commit()
        await db.refresh(college)
        return college
    
    @staticmethod
    async def get_college(db: AsyncSession, college_id: UUID) -> Optional[College]:
        """Get college by ID."""
        result = await db.execute(
            select(College).where(College.id == college_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_colleges(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> Tuple[List[College], int]:
        """List all colleges with pagination."""
        query = select(College)
        
        if is_active is not None:
            query = query.where(College.is_active == is_active)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(College.created_at.desc())
        result = await db.execute(query)
        colleges = result.scalars().all()
        
        return list(colleges), total
    
    @staticmethod
    async def update_college(
        db: AsyncSession, 
        college_id: UUID, 
        data: CollegeUpdate
    ) -> Optional[College]:
        """Update a college."""
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(college, field, value)
        
        college.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(college)
        return college
    
    @staticmethod
    async def delete_college(db: AsyncSession, college_id: UUID) -> bool:
        """Delete a college (soft delete by setting is_active=False)."""
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return False
        
        college.is_active = False
        college.updated_at = datetime.utcnow()
        await db.commit()
        return True


# =============================================================================
# COLLEGE FEATURE OPERATIONS
# =============================================================================

class CollegeFeatureService:
    """Service for college feature operations."""
    
    @staticmethod
    async def get_college_features(db: AsyncSession, college_id: UUID) -> List[CollegeFeature]:
        """Get all features for a college (including disabled ones)."""
        # First verify college exists
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return []
        
        result = await db.execute(
            select(CollegeFeature).where(CollegeFeature.college_id == college_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_enabled_features_count(db: AsyncSession, college_id: UUID) -> int:
        """Get count of enabled features for a college."""
        result = await db.execute(
            select(func.count(CollegeFeature.id)).where(
                CollegeFeature.college_id == college_id,
                CollegeFeature.is_enabled == True
            )
        )
        return result.scalar()
    
    @staticmethod
    async def toggle_feature(
        db: AsyncSession, 
        college_id: UUID, 
        data: CollegeFeatureToggle
    ) -> Optional[CollegeFeature]:
        """Enable or disable a feature for a college."""
        # Verify college exists
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return None
        
        # Validate feature key
        if data.feature_key not in PLATFORM_FEATURES:
            raise ValueError(f"Invalid feature key: {data.feature_key}")
        
        # Check if feature exists for this college
        result = await db.execute(
            select(CollegeFeature).where(
                CollegeFeature.college_id == college_id,
                CollegeFeature.feature_key == data.feature_key
            )
        )
        feature = result.scalar_one_or_none()
        
        if feature:
            # Update existing
            feature.is_enabled = data.is_enabled
        else:
            # Create new
            feature = CollegeFeature(
                college_id=college_id,
                feature_key=data.feature_key,
                is_enabled=data.is_enabled
            )
            db.add(feature)
        
        await db.commit()
        await db.refresh(feature)
        return feature


# =============================================================================
# ROLE FEATURE PERMISSION OPERATIONS
# =============================================================================

class RoleFeatureService:
    """Service for role feature permission operations."""
    
    VALID_ROLES = [
        RoleEnum.COLLEGE_ADMIN.value,
        RoleEnum.STAFF.value,
        RoleEnum.FACULTY.value,
        RoleEnum.TRAINER.value,
        RoleEnum.STUDENT.value,
    ]
    
    @staticmethod
    async def get_role_features(
        db: AsyncSession, 
        college_id: UUID,
        role: Optional[str] = None
    ) -> List[RoleFeaturePermission]:
        """Get role feature permissions for a college."""
        # Verify college exists
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return []
        
        query = select(RoleFeaturePermission).where(
            RoleFeaturePermission.college_id == college_id
        )
        
        if role:
            query = query.where(RoleFeaturePermission.role == role)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def toggle_role_feature(
        db: AsyncSession, 
        college_id: UUID, 
        role: str,
        feature_key: str,
        is_enabled: bool
    ) -> Optional[RoleFeaturePermission]:
        """Enable or disable a feature for a role in a college."""
        # Verify college exists
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return None
        
        # Validate role
        if role not in RoleFeatureService.VALID_ROLES:
            raise ValueError(f"Invalid role: {role}")
        
        # Validate feature key
        if feature_key not in PLATFORM_FEATURES:
            raise ValueError(f"Invalid feature key: {feature_key}")
        
        # Check if college-level feature is enabled (cannot enable role feature if college feature is disabled)
        college_feature_result = await db.execute(
            select(CollegeFeature).where(
                CollegeFeature.college_id == college_id,
                CollegeFeature.feature_key == feature_key
            )
        )
        college_feature = college_feature_result.scalar_one_or_none()
        
        if is_enabled and college_feature and not college_feature.is_enabled:
            raise ValueError(
                f"Cannot enable '{feature_key}' for role '{role}' because "
                f"the feature is disabled at college level"
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
            # Update existing
            permission.is_enabled = is_enabled
        else:
            # Create new
            permission = RoleFeaturePermission(
                college_id=college_id,
                role=role,
                feature_key=feature_key,
                is_enabled=is_enabled
            )
            db.add(permission)
        
        await db.commit()
        await db.refresh(permission)
        return permission


# =============================================================================
# USER OPERATIONS (PLATFORM LEVEL)
# =============================================================================

class PlatformUserService:
    """Service for platform-level user operations."""
    
    VALID_ROLES = [
        RoleEnum.PLATFORM_ADMIN.value,
        RoleEnum.COLLEGE_ADMIN.value,
        RoleEnum.STAFF.value,
        RoleEnum.FACULTY.value,
        RoleEnum.TRAINER.value,
        RoleEnum.STUDENT.value,
    ]
    
    @staticmethod
    async def create_user(db: AsyncSession, data: PlatformUserCreate) -> User:
        """Create a new user at platform level."""
        # Validate role
        if data.role not in PlatformUserService.VALID_ROLES:
            raise ValueError(f"Invalid role: {data.role}")
        
        # Platform admin cannot be assigned to a college
        if data.role == RoleEnum.PLATFORM_ADMIN.value and data.college_id is not None:
            raise ValueError("Platform admin cannot be assigned to a college")
        
        # All other roles must be assigned to a college
        if data.role != RoleEnum.PLATFORM_ADMIN.value and data.college_id is None:
            raise ValueError(f"Role '{data.role}' must be assigned to a college")
        
        user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role=data.role,
            college_id=data.college_id,
            is_active=data.is_active
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def get_user(db: AsyncSession, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        college_id: Optional[UUID] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[User], int]:
        """List all users with pagination."""
        query = select(User).options(selectinload(User.college))
        
        if role:
            query = query.where(User.role == role)
        if college_id:
            query = query.where(User.college_id == college_id)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Add college_name to each user
        users_with_college = []
        for user in users:
            user.college_name = user.college.name if user.college else None
            users_with_college.append(user)
        
        return users_with_college, total
    
    @staticmethod
    async def update_user(
        db: AsyncSession, 
        user_id: UUID, 
        data: PlatformUserUpdate
    ) -> Optional[User]:
        """Update a user."""
        user = await PlatformUserService.get_user(db, user_id)
        if not user:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate role change
        if "role" in update_data and update_data["role"] not in PlatformUserService.VALID_ROLES:
            raise ValueError(f"Invalid role: {update_data['role']}")
        
        # Validate college assignment
        new_role = update_data.get("role", user.role)
        new_college_id = update_data.get("college_id", user.college_id)
        
        if new_role == RoleEnum.PLATFORM_ADMIN.value and new_college_id is not None:
            raise ValueError("Platform admin cannot be assigned to a college")
        
        if new_role != RoleEnum.PLATFORM_ADMIN.value and new_college_id is None:
            raise ValueError(f"Role '{new_role}' must be assigned to a college")
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def delete_user(db: AsyncSession, user_id: UUID) -> bool:
        """Soft delete a user (deactivate)."""
        user = await PlatformUserService.get_user(db, user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        await db.commit()
        return True


# =============================================================================
# ANALYTICS OPERATIONS
# =============================================================================

class AnalyticsService:
    """Service for platform analytics."""
    
    @staticmethod
    async def get_platform_analytics(db: AsyncSession) -> PlatformAnalyticsResponse:
        """Get platform-wide analytics."""
        # Total colleges
        college_result = await db.execute(
            select(func.count(College.id))
        )
        total_colleges = college_result.scalar()
        
        # Active vs inactive colleges
        active_colleges_result = await db.execute(
            select(func.count(College.id)).where(College.is_active == True)
        )
        inactive_colleges_result = await db.execute(
            select(func.count(College.id)).where(College.is_active == False)
        )
        colleges_by_status = {
            "active": active_colleges_result.scalar(),
            "inactive": inactive_colleges_result.scalar()
        }
        
        # Total users
        users_result = await db.execute(
            select(func.count(User.id))
        )
        total_users = users_result.scalar()
        
        # Users by role
        users_by_role = {}
        for role in [r.value for r in RoleEnum]:
            role_result = await db.execute(
                select(func.count(User.id)).where(User.role == role)
            )
            users_by_role[role] = role_result.scalar()
        
        # Total classes
        classes_result = await db.execute(
            select(func.count(Class.id))
        )
        total_classes = classes_result.scalar()
        
        # Total sessions
        sessions_result = await db.execute(
            select(func.count(SessionModel.id))
        )
        total_sessions = sessions_result.scalar()
        
        # Active sessions
        active_sessions_result = await db.execute(
            select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
        )
        active_sessions = active_sessions_result.scalar()
        
        return PlatformAnalyticsResponse(
            total_colleges=total_colleges,
            total_users=total_users,
            total_classes=total_classes,
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            users_by_role=users_by_role,
            colleges_by_status=colleges_by_status
        )
    
    @staticmethod
    async def get_college_analytics(
        db: AsyncSession, 
        college_id: UUID
    ) -> Optional[CollegeAnalyticsResponse]:
        """Get analytics for a specific college."""
        # Verify college exists
        college = await CollegeService.get_college(db, college_id)
        if not college:
            return None
        
        # Users in college
        users_result = await db.execute(
            select(func.count(User.id)).where(User.college_id == college_id)
        )
        total_users = users_result.scalar()
        
        # Users by role in college
        users_by_role = {}
        for role in [r.value for r in RoleEnum]:
            role_result = await db.execute(
                select(func.count(User.id)).where(
                    and_(User.college_id == college_id, User.role == role)
                )
            )
            users_by_role[role] = role_result.scalar()
        
        # Classes in college
        classes_result = await db.execute(
            select(func.count(Class.id)).where(Class.college_id == college_id)
        )
        total_classes = classes_result.scalar()
        
        # Sessions in college
        sessions_result = await db.execute(
            select(func.count(SessionModel.id)).where(SessionModel.college_id == college_id)
        )
        total_sessions = sessions_result.scalar()
        
        # Active sessions
        active_sessions_result = await db.execute(
            select(func.count(SessionModel.id)).where(
                and_(SessionModel.college_id == college_id, SessionModel.is_active == True)
            )
        )
        active_sessions = active_sessions_result.scalar()
        
        return CollegeAnalyticsResponse(
            college_id=college_id,
            college_name=college.name,
            total_users=total_users,
            total_classes=total_classes,
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            users_by_role=users_by_role
        )


# =============================================================================
# AUDIT LOG OPERATIONS
# =============================================================================

class AuditLogService:
    """Service for audit log operations."""
    
    @staticmethod
    async def create_audit_log(
        db: AsyncSession,
        user_id: Optional[UUID],
        action: str,
        entity_type: str,
        entity_id: Optional[UUID] = None,
        college_id: Optional[UUID] = None
    ) -> AuditLog:
        """Create an audit log entry."""
        log = AuditLog(
            performed_by=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            college_id=college_id
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log
    
    @staticmethod
    async def list_audit_logs(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
        college_id: Optional[UUID] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[AuditLog], int]:
        """List audit logs with filters."""
        query = select(AuditLog).order_by(AuditLog.created_at.desc())
        
        if user_id:
            query = query.where(AuditLog.performed_by == user_id)
        if college_id:
            query = query.where(AuditLog.college_id == college_id)
        if action:
            query = query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        
        return list(logs), total
