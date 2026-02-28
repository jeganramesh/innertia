"""
Feature Guard System - Backend enforcement for multi-tenant feature gating.

This module provides dependency injection for feature access control.
Every protected endpoint must check:
1. User is authenticated
2. User's college has the feature enabled
3. User's role has permission to access the feature

No frontend-only hiding - all enforcement happens at the backend.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.accounts.dependencies import get_current_user
from app.models.models import User, CollegeFeature, RoleFeaturePermission, RoleEnum


# Available platform features
PLATFORM_FEATURES = [
    "attendance_tracking",
    "ai_notes",
    "placement_module",
    "assessment_module",
    "advanced_reports",
    "live_session_lock",
    "student_portal",
    "faculty_portal",
    "staff_portal",
    "trainer_portal",
    "college_analytics",
]


class FeatureGuard:
    """
    Feature guard for checking feature access.
    
    This class handles:
    - College-level feature enablement
    - Role-level feature permissions
    - Platform admin bypass
    """
    
    def __init__(self, db: AsyncSession, current_user: User):
        self.db = db
        self.current_user = current_user
        self._college_features: Optional[dict] = None
        self._role_permissions: Optional[dict] = None
    
    async def _load_college_features(self) -> dict:
        """Load all enabled features for the user's college."""
        if self._college_features is not None:
            return self._college_features
        
        # Platform admin bypasses all feature checks
        if self.current_user.role == RoleEnum.PLATFORM_ADMIN.value:
            return {feature: True for feature in PLATFORM_FEATURES}
        
        # Non-platform admins must have a college
        if not self.current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not belong to a college"
            )
        
        result = await self.db.execute(
            select(CollegeFeature).where(
                CollegeFeature.college_id == self.current_user.college_id,
                CollegeFeature.is_enabled == True
            )
        )
        features = result.scalars().all()
        
        self._college_features = {f.feature_key: True for f in features}
        return self._college_features
    
    async def _load_role_permissions(self) -> dict:
        """Load all enabled role permissions for the user's college and role."""
        if self._role_permissions is not None:
            return self._role_permissions
        
        # Platform admin bypasses all permission checks
        if self.current_user.role == RoleEnum.PLATFORM_ADMIN.value:
            return {feature: True for feature in PLATFORM_FEATURES}
        
        # Non-platform admins must have a college
        if not self.current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not belong to a college"
            )
        
        result = await self.db.execute(
            select(RoleFeaturePermission).where(
                RoleFeaturePermission.college_id == self.current_user.college_id,
                RoleFeaturePermission.role == self.current_user.role,
                RoleFeaturePermission.is_enabled == True
            )
        )
        permissions = result.scalars().all()
        
        self._role_permissions = {p.feature_key: True for p in permissions}
        return self._role_permissions
    
    async def check_feature(self, feature_key: str) -> bool:
        """
        Check if user can access a specific feature.
        
        Returns True if access is granted.
        Raises HTTPException(403) if access is denied.
        """
        # Platform admin bypass
        if self.current_user.role == RoleEnum.PLATFORM_ADMIN.value:
            return True
        
        # Check college-level feature
        college_features = await self._load_college_features()
        if not college_features.get(feature_key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_key}' is disabled for your college"
            )
        
        # Check role-level permission
        role_permissions = await self._load_role_permissions()
        if not role_permissions.get(feature_key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_key}' is not available for your role"
            )
        
        return True
    
    async def get_enabled_features(self) -> List[str]:
        """Get list of features enabled for user's college and role."""
        college_features = await self._load_college_features()
        role_permissions = await self._load_role_permissions()
        
        # Return features that are both college-enabled AND role-permitted
        enabled = []
        for feature in PLATFORM_FEATURES:
            if college_features.get(feature) and role_permissions.get(feature):
                enabled.append(feature)
        
        return enabled


def require_feature(feature_key: str):
    """
    FastAPI dependency for requiring a specific feature.
    
    Usage:
        @router.post("/assessments/")
        async def create_assessment(
            assessment: AssessmentCreate,
            _ = Depends(require_feature("assessment_module"))
        ):
            ...
    """
    async def dependency(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        guard = FeatureGuard(db, current_user)
        await guard.check_feature(feature_key)
        
    return dependency


def require_features(feature_keys: List[str]):
    """
    FastAPI dependency for requiring multiple features (ALL must be enabled).
    
    Usage:
        @router.get("/reports/")
        async def get_reports(
            _ = Depends(require_features(["advanced_reports", "attendance_tracking"]))
        ):
            ...
    """
    async def dependency(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        guard = FeatureGuard(db, current_user)
        for feature_key in feature_keys:
            await guard.check_feature(feature_key)
            
    return dependency


def require_any_feature(feature_keys: List[str]):
    """
    FastAPI dependency for requiring at least ONE of the features.
    
    Usage:
        @router.get("/analytics/")
        async def get_analytics(
            _ = Depends(require_any_feature(["college_analytics", "advanced_reports"]))
        ):
            ...
    """
    async def dependency(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        guard = FeatureGuard(db, current_user)
        
        # Platform admin bypass
        if current_user.role == RoleEnum.PLATFORM_ADMIN.value:
            return
        
        has_any = False
        for feature_key in feature_keys:
            try:
                await guard.check_feature(feature_key)
                has_any = True
                break
            except HTTPException:
                continue
        
        if not has_any:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"None of the required features are available: {', '.join(feature_keys)}"
            )
            
    return dependency


# =============================================================================
# ROLE-BASED ACCESS HELPERS
# =============================================================================

def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency for role-based access control.
    
    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(
            user_id: str,
            _ = Depends(require_role(["platform_admin", "college_admin"]))
        ):
            ...
    """
    async def dependency(
        current_user: User = Depends(get_current_user),
    ):
        # Normalize role for comparison
        user_role = current_user.role.lower() if current_user.role else ""
        allowed = [r.lower() for r in allowed_roles]
        
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
            
    return dependency


# Pre-defined role dependencies for common use cases
require_platform_admin = require_role([RoleEnum.PLATFORM_ADMIN.value])
require_college_admin = require_role([RoleEnum.COLLEGE_ADMIN.value])
require_faculty = require_role([RoleEnum.FACULTY.value])
require_staff = require_role([RoleEnum.STAFF.value])
require_trainer = require_role([RoleEnum.TRAINER.value])
require_student = require_role([RoleEnum.STUDENT.value])

# Convenience combinations
require_admin_or_college_admin = require_role([RoleEnum.PLATFORM_ADMIN.value, RoleEnum.COLLEGE_ADMIN.value])
require_teaching_staff = require_role([RoleEnum.FACULTY.value, RoleEnum.TRAINER.value])
