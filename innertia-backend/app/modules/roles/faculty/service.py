"""
Faculty service.
Business logic for faculty operations.
"""

from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User, Class, Session as SessionModel, Enrollment


class FacultyService:
    """Service class for faculty operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_faculty_classes(
        self,
        faculty_id: UUID,
        college_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Class], int]:
        """
        Get classes taught by faculty.
        
        Returns:
            Tuple of (classes list, total count)
        """
        # Base query
        query = select(Class).where(
            Class.faculty_id == faculty_id,
            Class.college_id == college_id,
            Class.is_archived == False
        )        
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
    
    async def get_class_with_details(
        self,
        class_id: UUID,
        faculty_id: UUID,
        college_id: UUID
    ) -> Optional[Class]:
        """Get class details if owned by faculty."""
        result = await self.db.execute(
            select(Class).where(
                Class.id == class_id,
                Class.faculty_id == faculty_id,
                Class.college_id == college_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_class_enrollment_count(self, class_id: UUID) -> int:
        """Get enrollment count for a class."""
        result = await self.db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.class_id == class_id)
        )
        return result.scalar() or 0
    
    async def get_class_sessions(
        self,
        class_id: UUID,
        limit: int = 10
    ) -> List[SessionModel]:
        """Get recent sessions for a class."""
        result = await self.db.execute(
            select(SessionModel).where(
                SessionModel.class_id == class_id
            ).order_by(SessionModel.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_faculty_sessions(
        self,
        faculty_id: UUID,
        college_id: UUID,
        class_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[SessionModel], int]:
        """
        Get sessions for faculty.
        
        Returns:
            Tuple of (sessions list, total count)
        """
        query = select(SessionModel).where(
            SessionModel.faculty_id == faculty_id,
            SessionModel.college_id == college_id
        )
        
        if class_id:
            query = query.where(SessionModel.class_id == class_id)
        if is_active is not None:
            query = query.where(SessionModel.is_active == is_active)
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(SessionModel.created_at.desc())
        result = await self.db.execute(query)
        sessions = result.scalars().all()
        
        return list(sessions), total
    
    async def get_session(
        self,
        session_id: UUID,
        faculty_id: UUID
    ) -> Optional[SessionModel]:
        """Get session if owned by faculty."""
        result = await self.db.execute(
            select(SessionModel).where(
                SessionModel.id == session_id,
                SessionModel.faculty_id == faculty_id
            )
        )
        return result.scalar_one_or_none()
    
    async def create_session(
        self,
        class_id: UUID,
        faculty_id: UUID,
        college_id: UUID,
        title: Optional[str] = None
    ) -> SessionModel:
        """Create a new session."""
        session = SessionModel(
            class_id=class_id,
            college_id=college_id,
            faculty_id=faculty_id,
            title=title,
            is_active=False
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session
    
    async def start_session(self, session: SessionModel) -> SessionModel:
        """Start a session."""
        session.is_active = True
        session.start_time = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(session)
        return session
    
    async def end_session(self, session: SessionModel) -> SessionModel:
        """End a session."""
        session.is_active = False
        session.end_time = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(session)
        return session
    
    async def get_class_enrollments(
        self,
        class_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Enrollment], int]:
        """Get enrollments for a class."""
        query = select(Enrollment).where(Enrollment.class_id == class_id)
        
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
    
    async def get_student_by_id(self, student_id: UUID) -> Optional[User]:
        """Get student by ID."""
        result = await self.db.execute(
            select(User).where(User.id == student_id)
        )
        return result.scalar_one_or_none()
