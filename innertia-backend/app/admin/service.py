"""
Admin Service Layer
Provides business logic and audit logging for admin operations.
"""

import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.models import User, AuditLog, College, CollegeFeature, RoleFeaturePermission


class AdminService:
    """Service class for admin operations with audit logging."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # =========================================================================
    # COLLEGE MANAGEMENT (Platform Admin Only)
    # =========================================================================
    
    async def create_college(
        self,
        name: str,
        code: str,
        performed_by: uuid.UUID,
        ip_address: Optional[str] = None
    ) -> College:
        """
        Create a new college.
        
        Args:
            name: College name
            code: Unique college code
            performed_by: Platform admin user ID
            ip_address: Client IP
            
        Returns:
            Created College instance
        """
        # Check if code already exists
        result = await self.db.execute(
            select(College).where(College.code == code)
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError(f"College code '{code}' already exists")
        
        college = College(
            name=name,
            code=code.upper(),
            is_active=True
        )
        
        self.db.add(college)
        
        # Log the action
        await self.log_admin_action(
            performed_by=performed_by,
            action="COLLEGE_CREATE",
            target_type="college",
            target_id=str(college.id),
            details={"name": name, "code": code},
            ip_address=ip_address
        )
        
        await self.db.commit()
        await self.db.refresh(college)
        
        return college
    
    async def update_college(
        self,
        college_id: uuid.UUID,
        performed_by: uuid.UUID,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
        ip_address: Optional[str] = None
    ) -> College:
        """
        Update college details.
        """
        result = await self.db.execute(
            select(College).where(College.id == college_id)
        )
        college = result.scalar_one_or_none()
        
        if not college:
            raise ValueError("College not found")
        
        changes = {}
        if name is not None:
            college.name = name
            changes["name"] = name
        if is_active is not None:
            college.is_active = is_active
            changes["is_active"] = is_active
        
        college.updated_at = datetime.utcnow()
        
        await self.log_admin_action(
            performed_by=performed_by,
            action="COLLEGE_UPDATE",
            target_type="college",
            target_id=str(college_id),
            details=changes,
            ip_address=ip_address
        )
        
        await self.db.commit()
        await self.db.refresh(college)
        
        return college
    
    async def get_colleges(
        self,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[College]:
        """
        Get all colleges with optional filtering.
        """
        query = select(College).order_by(College.created_at.desc())
        
        if is_active is not None:
            query = query.where(College.is_active == is_active)
        
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_college_stats(self, college_id: uuid.UUID) -> Dict[str, Any]:
        """
        Get statistics for a college.
        """
        # User counts by role
        user_counts = {}
        for role in ["staff", "faculty", "trainer", "student"]:
            result = await self.db.execute(
                select(func.count(User.id)).where(
                    User.college_id == college_id,
                    User.role == role
                )
            )
            user_counts[role] = result.scalar() or 0
        
        return {
            "college_id": str(college_id),
            "total_users": sum(user_counts.values()),
            "user_counts": user_counts
        }
    
    # =========================================================================
    # COLLEGE FEATURE TOGGLES (Platform Admin)
    # =========================================================================
    
    async def toggle_college_feature(
        self,
        college_id: uuid.UUID,
        feature_key: str,
        is_enabled: bool,
        performed_by: uuid.UUID,
        ip_address: Optional[str] = None
    ) -> CollegeFeature:
        """
        Enable or disable a feature for a college.
        """
        # Verify college exists
        result = await self.db.execute(
            select(College).where(College.id == college_id)
        )
        college = result.scalar_one_or_none()
        if not college:
            raise ValueError("College not found")
        
        # Check if feature exists
        result = await self.db.execute(
            select(CollegeFeature).where(
                CollegeFeature.college_id == college_id,
                CollegeFeature.feature_key == feature_key
            )
        )
        feature = result.scalar_one_or_none()
        
        if feature:
            feature.is_enabled = is_enabled
        else:
            feature = CollegeFeature(
                college_id=college_id,
                feature_key=feature_key,
                is_enabled=is_enabled
            )
            self.db.add(feature)
        
        await self.log_admin_action(
            performed_by=performed_by,
            action="FEATURE_TOGGLE",
            target_type="college_feature",
            target_id=str(college_id),
            details={
                "feature_key": feature_key,
                "is_enabled": is_enabled
            },
            ip_address=ip_address
        )
        
        await self.db.commit()
        await self.db.refresh(feature)
        
        return feature
    
    async def get_college_features(
        self,
        college_id: uuid.UUID
    ) -> List[CollegeFeature]:
        """
        Get all features for a college.
        """
        result = await self.db.execute(
            select(CollegeFeature).where(
                CollegeFeature.college_id == college_id
            )
        )
        return result.scalars().all()
    
    # =========================================================================
    # ROLE FEATURE PERMISSIONS (College Admin)
    # =========================================================================
    
    async def set_role_permission(
        self,
        college_id: uuid.UUID,
        role: str,
        feature_key: str,
        is_enabled: bool,
        performed_by: uuid.UUID,
        ip_address: Optional[str] = None
    ) -> RoleFeaturePermission:
        """
        Set permission for a role to access a feature.
        """
        result = await self.db.execute(
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
            self.db.add(permission)
        
        await self.log_admin_action(
            performed_by=performed_by,
            action="ROLE_PERMISSION_CHANGE",
            target_type="role_permission",
            target_id=str(college_id),
            details={
                "role": role,
                "feature_key": feature_key,
                "is_enabled": is_enabled
            },
            ip_address=ip_address,
            college_id=college_id  # Include college_id for college-scoped logging
        )
        
        await self.db.commit()
        await self.db.refresh(permission)
        
        return permission
    
    async def get_role_permissions(
        self,
        college_id: uuid.UUID,
        role: Optional[str] = None
    ) -> List[RoleFeaturePermission]:
        """
        Get role permissions for a college.
        """
        query = select(RoleFeaturePermission).where(
            RoleFeaturePermission.college_id == college_id
        )
        
        if role:
            query = query.where(RoleFeaturePermission.role == role)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    # =========================================================================
    # AUDIT LOGGING
    # =========================================================================
    
    async def log_admin_action(
        self,
        performed_by: uuid.UUID,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        college_id: Optional[uuid.UUID] = None
    ) -> AuditLog:
        """
        Log an admin action for audit trail.
        
        Args:
            performed_by: User ID performing the action
            action: Action type (CREATE, UPDATE, DELETE, etc.)
            target_type: Type of target (user, class, session, etc.)
            target_id: ID of the target resource
            details: Additional details about the action
            ip_address: Client IP address
            college_id: College ID for scoped logging
            
        Returns:
            Created AuditLog instance
        """
        # Convert details to JSON string
        metadata_json = None
        if details:
            try:
                metadata_json = json.dumps(details)
            except (TypeError, ValueError):
                metadata_json = json.dumps({"error": "Failed to serialize details"})
        
        audit_log = AuditLog(
            performed_by=performed_by,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata_json,
            ip_address=ip_address,
            college_id=college_id
        )
        
        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)
        
        return audit_log
    
    async def log_admin_action(
        self,
        performed_by: uuid.UUID,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Log an admin action for audit trail.
        
        Args:
            performed_by: User ID performing the action
            action: Action type (CREATE, UPDATE, DELETE, etc.)
            target_type: Type of target (user, class, session, etc.)
            target_id: ID of the target resource
            details: Additional details about the action
            ip_address: Client IP address
            
        Returns:
            Created AuditLog instance
        """
        # Convert details to JSON string
        metadata_json = None
        if details:
            try:
                metadata_json = json.dumps(details)
            except (TypeError, ValueError):
                metadata_json = json.dumps({"error": "Failed to serialize details"})
        
        audit_log = AuditLog(
            performed_by=performed_by,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata_json,
            ip_address=ip_address
        )
        
        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)
        
        return audit_log
    
    async def get_audit_logs(
        self,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        performed_by: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """
        Retrieve audit logs with filters.
        """
        query = select(AuditLog).order_by(AuditLog.created_at.desc())
        
        if target_type:
            query = query.where(AuditLog.target_type == target_type)
        if target_id:
            query = query.where(AuditLog.target_id == target_id)
        if performed_by:
            query = query.where(AuditLog.performed_by == performed_by)
        if action:
            query = query.where(AuditLog.action == action)
        
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def toggle_user_active(
        self,
        user_id: uuid.UUID,
        performed_by: uuid.UUID
    ) -> User:
        """
        Toggle user active status (soft enable/disable).
        
        Args:
            user_id: ID of user to toggle
            performed_by: ID of admin performing the action
            
        Returns:
            Updated User instance
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        # Toggle status
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        
        # Log the action
        await self.log_admin_action(
            performed_by=performed_by,
            action="TOGGLE_USER" if user.is_active else "DISABLE_USER",
            target_type="user",
            target_id=str(user_id),
            details={
                "email": user.email,
                "new_status": user.is_active
            }
        )
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return user


async def log_admin_action(
    db: AsyncSession,
    performed_by: uuid.UUID,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Convenience function to log admin action.
    """
    service = AdminService(db)
    return await service.log_admin_action(
        performed_by=performed_by,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address
    )
