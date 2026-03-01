"""
College Admin Service.
Business logic for college admin operations.
"""

from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    User, Class, Enrollment, Session as SessionModel,
    CollegeFeature, RoleFeaturePermission
)


class CollegeAdminService:
    """Service class for college admin operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # =============================================================================
    # USER MANAGEMENT (College Level)
    # =============================================================================
    
    async def get_college_users(
        self,
        college_id: UUID,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[User], int]:
        """Get all users in a college."""
        query = select(User).where(User.college_id == college_id)
        
        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    async def get_user_by_id(self, user_id: UUID, college_id: UUID) -> Optional[User]:
        """Get user by ID within college."""
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.college_id == college_id
            )
        )
        return result.scalar_one_or_none()
    
    async def update_user(
        self,
        user: User,
        name: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> User:
        """Update a user."""
        if name is not None:
            user.name = name
        if role is not None:
            user.role = role
        if is_active is not None:
            user.is_active = is_active
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    # =============================================================================
    # CLASS MANAGEMENT
    # =============================================================================
    
    async def get_classes(
        self,
        college_id: UUID,
        skip: int = 0,
        limit: int = 100,
        department: Optional[str] = None,
        is_archived: Optional[bool] = None
    ) -> Tuple[List[Class], int]:
        """Get all classes in a college."""
        query = select(Class).where(Class.college_id == college_id)
        
        if department:
            query = query.where(Class.department == department)
        if is_archived is not None:
            query = query.where(Class.is_archived == is_archived)
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Class.name)
        result = await self.db.execute(query)
        classes = result.scalars().all()
        
        return list(classes), total
    
    async def get_class_by_id(self, class_id: UUID, college_id: UUID) -> Optional[Class]:
        """Get class by ID within college."""
        result = await self.db.execute(
            select(Class).where(
                Class.id == class_id,
                Class.college_id == college_id
            )
        )
        return result.scalar_one_or_none()
    
    async def create_class(
        self,
        college_id: UUID,
        name: str,
        department: Optional[str] = None,
        academic_year: Optional[str] = None,
        faculty_id: Optional[UUID] = None
    ) -> Class:
        """Create a new class."""
        class_obj = Class(
            name=name,
            college_id=college_id,
            department=department,
            academic_year=academic_year,
            faculty_id=faculty_id
        )
        self.db.add(class_obj)
        await self.db.commit()
        await self.db.refresh(class_obj)
        return class_obj
    
    async def update_class(
        self,
        class_obj: Class,
        name: Optional[str] = None,
        department: Optional[str] = None,
        academic_year: Optional[str] = None,
        faculty_id: Optional[UUID] = None,
        is_archived: Optional[bool] = None
    ) -> Class:
        """Update a class."""
        if name is not None:
            class_obj.name = name
        if department is not None:
            class_obj.department = department
        if academic_year is not None:
            class_obj.academic_year = academic_year
        if faculty_id is not None:
            class_obj.faculty_id = faculty_id
        if is_archived is not None:
            class_obj.is_archived = is_archived
        
        await self.db.commit()
        await self.db.refresh(class_obj)
        return class_obj
    
    # =============================================================================
    # ENROLLMENT MANAGEMENT
    # =============================================================================
    
    async def get_enrollments(
        self,
        class_id: Optional[UUID] = None,
        student_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Enrollment], int]:
        """Get enrollments with filters."""
        query = select(Enrollment)
        
        if class_id:
            query = query.where(Enrollment.class_id == class_id)
        if student_id:
            query = query.where(Enrollment.student_id == student_id)
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Enrollment.enrolled_at.desc())
        result = await self.db.execute(query)
        enrollments = result.scalars().all()
        
        return list(enrollments), total
    
    async def create_enrollment(
        self,
        student_id: UUID,
        class_id: UUID
    ) -> Enrollment:
        """Create a new enrollment."""
        enrollment = Enrollment(
            student_id=student_id,
            class_id=class_id
        )
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment
    
    async def delete_enrollment(self, enrollment: Enrollment) -> None:
        """Delete an enrollment."""
        await self.db.delete(enrollment)
        await self.db.commit()
    
    # =============================================================================
    # ROLE FEATURE PERMISSIONS
    # =============================================================================
    
    async def get_role_permissions(
        self,
        college_id: UUID
    ) -> List[RoleFeaturePermission]:
        """Get all role permissions for a college."""
        result = await self.db.execute(
            select(RoleFeaturePermission).where(
                RoleFeaturePermission.college_id == college_id
            )
        )
        return list(result.scalars().all())
    
    async def update_role_permission(
        self,
        college_id: UUID,
        role: str,
        feature_key: str,
        is_enabled: bool
    ) -> RoleFeaturePermission:
        """Update role feature permission."""
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
        
        await self.db.commit()
        await self.db.refresh(permission)
        return permission
    
    # =============================================================================
    # DASHBOARD STATS
    # =============================================================================
    
    async def get_dashboard_stats(self, college_id: UUID) -> dict:
        """Get dashboard statistics for college."""
        # Total users
        users_result = await self.db.execute(
            select(func.count(User.id)).where(User.college_id == college_id)
        )
        total_users = users_result.scalar() or 0
        
        # Total classes
        classes_result = await self.db.execute(
            select(func.count(Class.id)).where(
                Class.college_id == college_id,
                Class.is_archived == False
            )
        )
        total_classes = classes_result.scalar() or 0
        
        # Active sessions
        sessions_result = await self.db.execute(
            select(func.count(SessionModel.id)).where(
                SessionModel.college_id == college_id,
                SessionModel.is_active == True
            )
        )
        active_sessions = sessions_result.scalar() or 0
        
        # Students count
        students_result = await self.db.execute(
            select(func.count(User.id)).where(
                User.college_id == college_id,
                User.role == "student",
                User.is_active == True
            )
        )
        total_students = students_result.scalar() or 0
        
        # Faculty count
        faculty_result = await self.db.execute(
            select(func.count(User.id)).where(
                User.college_id == college_id,
                User.role == "faculty",
                User.is_active == True
            )
        )
        total_faculty = faculty_result.scalar() or 0
        
        return {
            "total_users": total_users,
            "total_classes": total_classes,
            "active_sessions": active_sessions,
            "total_students": total_students,
            "total_faculty": total_faculty
        }
