"""
Platform admin module.
Handles platform-level administrative operations.
"""

from app.modules.platform.admin.service import AnalyticsService
from app.modules.platform.admin.schemas import PlatformAnalyticsResponse
from app.modules.platform.admin.router import router

__all__ = ["AnalyticsService", "PlatformAnalyticsResponse", "router"]
