"""
Legacy admin router - redirects to new modular structure.
This module provides backward compatibility.
"""

from app.modules.roles.admin import router

# For backward compatibility, re-export with alias
__all__ = ["router"]
