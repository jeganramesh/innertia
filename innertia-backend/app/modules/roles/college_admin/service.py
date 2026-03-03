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
    CollegeFeature, RoleFeaturePermission,
    Exam, ExamQuestion, ExamSubmission,
    Assessment, AssessmentQuestion, AssessmentSubmission
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
            "total_faculty": total_faculty,
            "assessment_module_enabled": True,
            "exam_module_enabled": True,
            "total_exams": 0,
            "total_assessments": 0,
            "completed_assessments": 0,
            "pending_assessments": 0
        }
    
    # =============================================================================
    # EXAM MANAGEMENT
    # =============================================================================
    
    async def get_exams(
        self,
        college_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        exam_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Exam], int]:
        """Get all exams for a college with filtering and pagination."""
        query = select(Exam).where(
            Exam.college_id == college_id,
            Exam.deleted_at.is_(None)
        )
        
        if status:
            query = query.where(Exam.status == status)
        if exam_type:
            query = query.where(Exam.exam_type == exam_type)
        if search:
            query = query.where(Exam.title.ilike(f"%{search}%"))
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Exam.created_at.desc())
        result = await self.db.execute(query)
        exams = result.scalars().all()
        
        return list(exams), total
    
    async def get_exam_by_id(self, exam_id: UUID, college_id: UUID) -> Optional[Exam]:
        """Get an exam by ID within college."""
        result = await self.db.execute(
            select(Exam).where(
                Exam.id == exam_id,
                Exam.college_id == college_id,
                Exam.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()
    
    async def create_exam(
        self,
        college_id: UUID,
        created_by: UUID,
        title: str,
        description: Optional[str] = None,
        exam_type: str = "quiz",
        scheduled_at: Optional[datetime] = None,
        duration_minutes: Optional[int] = None,
        total_marks: Optional[int] = None,
        passing_marks: Optional[int] = None,
        instructions: Optional[str] = None
    ) -> Exam:
        """Create a new exam."""
        exam = Exam(
            college_id=college_id,
            created_by=created_by,
            title=title,
            description=description,
            exam_type=exam_type,
            status="draft",
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            total_marks=total_marks,
            passing_marks=passing_marks,
            instructions=instructions
        )
        self.db.add(exam)
        await self.db.commit()
        await self.db.refresh(exam)
        return exam
    
    async def update_exam(
        self,
        exam: Exam,
        title: Optional[str] = None,
        description: Optional[str] = None,
        exam_type: Optional[str] = None,
        scheduled_at: Optional[datetime] = None,
        duration_minutes: Optional[int] = None,
        total_marks: Optional[int] = None,
        passing_marks: Optional[int] = None,
        instructions: Optional[str] = None
    ) -> Exam:
        """Update an exam."""
        if title is not None:
            exam.title = title
        if description is not None:
            exam.description = description
        if exam_type is not None:
            exam.exam_type = exam_type
        if scheduled_at is not None:
            exam.scheduled_at = scheduled_at
        if duration_minutes is not None:
            exam.duration_minutes = duration_minutes
        if total_marks is not None:
            exam.total_marks = total_marks
        if passing_marks is not None:
            exam.passing_marks = passing_marks
        if instructions is not None:
            exam.instructions = instructions
        
        await self.db.commit()
        await self.db.refresh(exam)
        return exam
    
    async def delete_exam(self, exam: Exam) -> None:
        """Soft delete an exam."""
        exam.deleted_at = datetime.utcnow()
        await self.db.commit()
    
    async def publish_exam(self, exam: Exam) -> Exam:
        """Publish an exam (change status to scheduled)."""
        exam.status = "scheduled"
        await self.db.commit()
        await self.db.refresh(exam)
        return exam
    
    async def cancel_exam(self, exam: Exam) -> Exam:
        """Cancel an exam."""
        exam.status = "cancelled"
        await self.db.commit()
        await self.db.refresh(exam)
        return exam
    
    async def get_exam_stats(self, college_id: UUID) -> dict:
        """Get exam statistics for a college."""
        base_query = select(func.count(Exam.id)).where(
            Exam.college_id == college_id,
            Exam.deleted_at.is_(None)
        )
        
        total = (await self.db.execute(base_query)).scalar() or 0
        draft = (await self.db.execute(base_query.where(Exam.status == "draft"))).scalar() or 0
        scheduled = (await self.db.execute(base_query.where(Exam.status == "scheduled"))).scalar() or 0
        ongoing = (await self.db.execute(base_query.where(Exam.status == "ongoing"))).scalar() or 0
        completed = (await self.db.execute(base_query.where(Exam.status == "completed"))).scalar() or 0
        cancelled = (await self.db.execute(base_query.where(Exam.status == "cancelled"))).scalar() or 0
        
        return {
            "total": total,
            "draft": draft,
            "scheduled": scheduled,
            "ongoing": ongoing,
            "completed": completed,
            "cancelled": cancelled
        }
    
    # =============================================================================
    # ASSESSMENT MANAGEMENT
    # =============================================================================
    
    async def get_assessments(
        self,
        college_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        assessment_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Assessment], int]:
        """Get all assessments for a college with filtering and pagination."""
        query = select(Assessment).where(
            Assessment.college_id == college_id,
            Assessment.deleted_at.is_(None)
        )
        
        if status:
            query = query.where(Assessment.status == status)
        if assessment_type:
            query = query.where(Assessment.assessment_type == assessment_type)
        if search:
            query = query.where(Assessment.title.ilike(f"%{search}%"))
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Assessment.created_at.desc())
        result = await self.db.execute(query)
        assessments = result.scalars().all()
        
        return list(assessments), total
    
    async def get_assessment_by_id(self, assessment_id: UUID, college_id: UUID) -> Optional[Assessment]:
        """Get an assessment by ID within college."""
        result = await self.db.execute(
            select(Assessment).where(
                Assessment.id == assessment_id,
                Assessment.college_id == college_id,
                Assessment.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()
    
    async def create_assessment(
        self,
        college_id: UUID,
        created_by: UUID,
        title: str,
        description: Optional[str] = None,
        assessment_type: str = "quiz",
        due_at: Optional[datetime] = None,
        total_marks: Optional[int] = None
    ) -> Assessment:
        """Create a new assessment."""
        assessment = Assessment(
            college_id=college_id,
            created_by=created_by,
            title=title,
            description=description,
            assessment_type=assessment_type,
            status="draft",
            due_at=due_at,
            total_marks=total_marks
        )
        self.db.add(assessment)
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
    
    async def update_assessment(
        self,
        assessment: Assessment,
        title: Optional[str] = None,
        description: Optional[str] = None,
        assessment_type: Optional[str] = None,
        due_at: Optional[datetime] = None,
        total_marks: Optional[int] = None
    ) -> Assessment:
        """Update an assessment."""
        if title is not None:
            assessment.title = title
        if description is not None:
            assessment.description = description
        if assessment_type is not None:
            assessment.assessment_type = assessment_type
        if due_at is not None:
            assessment.due_at = due_at
        if total_marks is not None:
            assessment.total_marks = total_marks
        
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
    
    async def delete_assessment(self, assessment: Assessment) -> None:
        """Soft delete an assessment."""
        assessment.deleted_at = datetime.utcnow()
        await self.db.commit()
    
    async def publish_assessment(self, assessment: Assessment) -> Assessment:
        """Publish an assessment."""
        assessment.status = "published"
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
    
    async def close_assessment(self, assessment: Assessment) -> Assessment:
        """Close an assessment."""
        assessment.status = "closed"
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
    
    async def get_assessment_stats(self, college_id: UUID) -> dict:
        """Get assessment statistics for a college."""
        base_query = select(func.count(Assessment.id)).where(
            Assessment.college_id == college_id,
            Assessment.deleted_at.is_(None)
        )
        
        total = (await self.db.execute(base_query)).scalar() or 0
        draft = (await self.db.execute(base_query.where(Assessment.status == "draft"))).scalar() or 0
        published = (await self.db.execute(base_query.where(Assessment.status == "published"))).scalar() or 0
        closed = (await self.db.execute(base_query.where(Assessment.status == "closed"))).scalar() or 0
        
        return {
            "total": total,
            "draft": draft,
            "published": published,
            "closed": closed
        }
