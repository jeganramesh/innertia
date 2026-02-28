"""
Staff router.
Handles operations for staff members.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import User, Class, Enrollment
from app.shared.permissions import require_roles
from app.accounts.dependencies import get_current_user


router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)


# =============================================================================
# STAFF DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def staff_dashboard(
    current_user: User = Depends(require_roles("staff")),
    db: AsyncSession = Depends(get_db)
):
    """Get staff dashboard data."""
    college_id = current_user.college_id
    
    # Get class count
    classes_result = await db.execute(
        select(func.count(Class.id)).where(
            Class.college_id == college_id,
            Class.is_archived == False
        )
    )
    class_count = classes_result.scalar()
    
    # Get student count
    students_result = await db.execute(
        select(func.count(User.id)).where(
            User.college_id == college_id,
            User.role == "student",
            User.is_active == True
        )
    )
    student_count = students_result.scalar()
    
    # Get faculty count
    faculty_result = await db.execute(
        select(func.count(User.id)).where(
            User.college_id == college_id,
            User.role == "faculty",
            User.is_active == True
        )
    )
    faculty_count = faculty_result.scalar()
    
    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name
        },
        "stats": {
            "classes": class_count,
            "students": student_count,
            "faculty": faculty_count
        }
    }


# =============================================================================
# CLASSES (STAFF VIEW)
# =============================================================================

@router.get("/classes")
async def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = None,
    current_user: User = Depends(require_roles("staff")),
    db: AsyncSession = Depends(get_db)
):
    """List classes in the college (staff view)."""
    query = select(Class).where(
        Class.college_id == current_user.college_id,
        Class.is_archived == False
    )
    
    if department:
        query = query.where(Class.department == department)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Class.name)
    result = await db.execute(query)
    classes = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "department": c.department,
                "academic_year": c.academic_year,
                "faculty_id": str(c.faculty_id) if c.faculty_id else None
            }
            for c in classes
        ],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/classes/{class_id}/enrollments")
async def list_class_enrollments(
    class_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("staff", "faculty")),
    db: AsyncSession = Depends(get_db)
):
    """List enrollments for a class."""
    # Verify class belongs to college
    class_result = await db.execute(
        select(Class).where(
            Class.id == class_id,
            Class.college_id == current_user.college_id
        )
    )
    if not class_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Get enrollments
    query = select(Enrollment).where(Enrollment.class_id == class_id)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    query = query.offset(skip).limit(limit).order_by(Enrollment.enrolled_at.desc())
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    # Get student details
    items = []
    for e in enrollments:
        student_result = await db.execute(
            select(User).where(User.id == e.student_id)
        )
        student = student_result.scalar_one_or_none()
        if student:
            items.append({
                "id": str(e.id),
                "student_id": str(e.student_id),
                "student_name": student.full_name,
                "student_email": student.email,
                "enrolled_at": e.enrolled_at.isoformat()
            })
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit
    }
