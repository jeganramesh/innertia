"""
Platform Admin Analytics Service.
Business logic for platform-wide analytics.
"""

from typing import Dict, Any
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User, College, Class, Session as SessionModel, AuditLog
from app.modules.platform.admin.schemas import PlatformAnalyticsResponse


class AnalyticsService:
    """Service class for platform-wide analytics."""

    @staticmethod
    async def get_platform_analytics(db: AsyncSession) -> PlatformAnalyticsResponse:
        """
        Get platform-wide analytics data.
        
        Args:
            db: Database session
            
        Returns:
            PlatformAnalyticsResponse with platform statistics
        """
        # Get total colleges
        college_result = await db.execute(
            select(func.count(College.id))
        )
        total_colleges = college_result.scalar() or 0

        # Get active colleges
        active_college_result = await db.execute(
            select(func.count(College.id)).where(College.is_active == True)
        )
        colleges_active = active_college_result.scalar() or 0

        # Get total users
        user_result = await db.execute(
            select(func.count(User.id)).where(User.deleted_at.is_(None))
        )
        total_users = user_result.scalar() or 0

        # Get users by role
        users_by_role = {}
        roles = ["admin", "college_admin", "staff", "faculty", "trainer", "student"]
        for role in roles:
            role_result = await db.execute(
                select(func.count(User.id)).where(
                    User.role == role,
                    User.is_active == True,
                    User.deleted_at.is_(None)
                )
            )
            users_by_role[role] = role_result.scalar() or 0

        # Get total classes
        class_result = await db.execute(select(func.count(Class.id)))
        total_classes = class_result.scalar() or 0

        # Get active sessions
        session_result = await db.execute(
            select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
        )
        active_sessions = session_result.scalar() or 0

        # Get recent activity (last 10 audit logs)
        recent_activity = []
        try:
            audit_result = await db.execute(
                select(AuditLog)
                .order_by(AuditLog.created_at.desc())
                .limit(10)
            )
            audit_logs = audit_result.scalars().all()
            
            for log in audit_logs:
                recent_activity.append({
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": str(log.entity_id) if log.entity_id else None,
                    "user_id": str(log.user_id) if log.user_id else None,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                })
        except Exception:
            # If audit logs table doesn't have expected structure, keep it empty
            pass

        return PlatformAnalyticsResponse(
            total_colleges=total_colleges,
            total_users=total_users,
            total_classes=total_classes,
            active_sessions=active_sessions,
            users_by_role=users_by_role,
            colleges_active=colleges_active,
            recent_activity=recent_activity,
            generated_at=datetime.utcnow().isoformat()
        )
