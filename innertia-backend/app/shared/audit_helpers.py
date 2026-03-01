"""
Audit Logging Helper Functions
Provides utilities for creating audit log entries.
"""

import json
from datetime import datetime
from uuid import UUID
from typing import Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AuditLog


async def create_audit_log(
    db: AsyncSession,
    action: str,
    performed_by: UUID,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    college_id: Optional[UUID] = None,
    metadata: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Create an audit log entry.
    
    Args:
        db: Database session
        action: Action type (CREATE, UPDATE, DELETE, TOGGLE, etc.)
        performed_by: User ID who performed the action
        target_type: Type of target (User, College, Class, etc.)
        target_id: ID of the target
        college_id: College ID (optional, for college-level actions)
        metadata: Additional metadata as dict
        ip_address: IP address of the request
    
    Returns:
        Created AuditLog entry
    """
    audit_log = AuditLog(
        action=action,
        performed_by=performed_by,
        target_type=target_type,
        target_id=target_id,
        college_id=college_id,
        metadata_json=json.dumps(metadata) if metadata else None,
        ip_address=ip_address
    )
    db.add(audit_log)
    # Don't commit here - let the caller handle it
    return audit_log
