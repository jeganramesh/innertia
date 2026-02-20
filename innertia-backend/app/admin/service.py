"""
Admin Service Layer
Provides business logic and audit logging for admin operations.
"""

import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.models import User, AuditLog


class AdminService:
    """Service class for admin operations with audit logging."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
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
