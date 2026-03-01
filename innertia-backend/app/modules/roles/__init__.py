"""
Roles module containing role-specific routers.
"""

from app.modules.roles.admin import router as admin_router
from app.modules.roles.college_admin.router import router as college_admin_router
from app.modules.roles.staff.router import router as staff_router
from app.modules.roles.faculty.router import router as faculty_router
from app.modules.roles.trainer.router import router as trainer_router
from app.modules.roles.student.router import router as student_router

__all__ = [
    "admin_router",
    "college_admin_router",
    "staff_router", 
    "faculty_router",
    "trainer_router",
    "student_router"
]
