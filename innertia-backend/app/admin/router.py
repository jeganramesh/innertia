"""
Admin routes.
Handles user management, bulk uploads, and class management.
"""

import io
import uuid
from typing import Optional
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.accounts.dependencies import require_admin
from app.models.models import User
from app.accounts.utils import hash_password
from app.models.models import Class, Session as SessionModel, Enrollment
from app.admin.schemas import (
    UserCreateAdmin, UserUpdateAdmin, UserOutAdmin, UserListResponse,
    BulkUploadResponse, ClassCreate, ClassUpdate, ClassOut, DashboardStats
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============ User Management Endpoints ============

@router.post(
    "/users",
    response_model=UserOutAdmin,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)]
)
async def create_user(
    user_data: UserCreateAdmin,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (admin only).
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role=user_data.role,
        is_active=user_data.is_active
    )
    
    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    return UserOutAdmin(
        id=str(new_user.id),
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )


@router.get(
    "/users",
    response_model=UserListResponse,
    dependencies=[Depends(require_admin)]
)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users with pagination and filters (admin only).
    """
    # Build query
    query = select(User)
    count_query = select(func.count(User.id))
    
    # Apply filters
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_filter)) | 
            (User.name.ilike(search_filter))
        )
        count_query = count_query.where(
            (User.email.ilike(search_filter)) | 
            (User.name.ilike(search_filter))
        )
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    user_list = [
        UserOutAdmin(
            id=str(u.id),
            email=u.email,
            name=u.name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at
        )
        for u in users
    ]
    
    return UserListResponse(
        users=user_list,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/users/{user_id}",
    response_model=UserOutAdmin,
    dependencies=[Depends(require_admin)]
)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user by ID (admin only).
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserOutAdmin(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.patch(
    "/users/{user_id}",
    response_model=UserOutAdmin,
    dependencies=[Depends(require_admin)]
)
async def update_user(
    user_id: str,
    user_data: UserUpdateAdmin,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user (admin only).
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(user)
    
    return UserOutAdmin(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)]
)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (admin only).
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await db.delete(user)
    await db.commit()
    
    return None


# ============ Bulk Upload Endpoints ============

@router.post(
    "/users/upload",
    response_model=BulkUploadResponse,
    dependencies=[Depends(require_admin)]
)
async def bulk_upload_users(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk upload users from CSV or Excel file (admin only).
    
    Expected columns:
    - name: User's name
    - email: User's email (unique)
    - role: Role (student, faculty, admin)
    - is_active: Boolean (true/false or 1/0)
    """
    # Validate file type
    allowed_types = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    
    if file_ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV and Excel files are allowed."
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size (max 5MB)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
    
    # Parse file
    try:
        if file_ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )
    
    # Validate columns
    required_columns = ["name", "email", "role", "is_active"]
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_cols)}"
        )
    
    # Process rows
    created_count = 0
    updated_count = 0
    failed_rows = []
    
    valid_roles = ["student", "faculty", "admin"]
    
    for idx, row in df.iterrows():
        row_num = idx + 2  # Account for header and 0-index
        
        try:
            # Validate email
            email = str(row["email"]).strip().lower()
            if not email or "@" not in email:
                failed_rows.append({
                    "row": row_num,
                    "email": email,
                    "error": "Invalid email format"
                })
                continue
            
            # Validate role
            role = str(row["role"]).strip().lower()
            if role not in valid_roles:
                failed_rows.append({
                    "row": row_num,
                    "email": email,
                    "error": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
                })
                continue
            
            # Validate is_active
            is_active_val = row["is_active"]
            if isinstance(is_active_val, bool):
                is_active = is_active_val
            elif isinstance(is_active_val, (int, float)):
                is_active = bool(is_active_val)
            else:
                is_active = str(is_active_val).lower() in ["true", "1", "yes"]
            
            # Get name
            name = str(row["name"]).strip() if pd.notna(row["name"]) else None
            
            # Check if user exists
            result = await db.execute(
                select(User).where(User.email == email)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                # Update existing user
                existing_user.name = name or existing_user.name
                existing_user.role = role
                existing_user.is_active = is_active
                existing_user.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                # Create new user
                # Generate a default password for new users
                import secrets
                default_password = secrets.token_urlsafe(8)
                hashed_password = hash_password(default_password)
                
                new_user = User(
                    email=email,
                    password_hash=hashed_password,
                    name=name,
                    role=role,
                    is_active=is_active
                )
                db.add(new_user)
                created_count += 1
                
        except Exception as e:
            failed_rows.append({
                "row": row_num,
                "error": str(e)
            })
    
    # Commit all changes
    await db.commit()
    
    return BulkUploadResponse(
        created_count=created_count,
        updated_count=updated_count,
        failed_rows=failed_rows
    )


# ============ Class Management Endpoints ============

@router.post(
    "/classes",
    response_model=ClassOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)]
)
async def create_class(
    class_data: ClassCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new class (admin only).
    """
    # Verify faculty exists
    try:
        faculty_uuid = uuid.UUID(class_data.faculty_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid faculty ID format"
        )
    
    result = await db.execute(
        select(User).where(
            and_(User.id == faculty_uuid, User.role == "faculty")
        )
    )
    faculty = result.scalar_one_or_none()
    
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty user not found"
        )
    
    # Create class
    new_class = Class(
        name=class_data.name,
        description=class_data.description,
        faculty_id=faculty_uuid
    )
    
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    
    return ClassOut(
        id=str(new_class.id),
        name=new_class.name,
        description=new_class.description,
        faculty_id=str(new_class.faculty_id),
        is_active=new_class.is_active,
        created_at=new_class.created_at,
        updated_at=new_class.updated_at
    )


@router.get(
    "/classes",
    response_model=list[ClassOut],
    dependencies=[Depends(require_admin)]
)
async def list_classes(
    db: AsyncSession = Depends(get_db)
):
    """
    List all classes (admin only).
    """
    result = await db.execute(
        select(Class).order_by(Class.created_at.desc())
    )
    classes = result.scalars().all()
    
    return [
        ClassOut(
            id=str(c.id),
            name=c.name,
            description=c.description,
            faculty_id=str(c.faculty_id),
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in classes
    ]


# ============ Dashboard Endpoints ============

@router.get(
    "/dashboard",
    response_model=DashboardStats,
    dependencies=[Depends(require_admin)]
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get admin dashboard statistics (admin only).
    """
    # Total users
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()
    
    # Users by role
    role_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_by_role = {row[0]: row[1] for row in role_result.all()}
    
    # Total classes
    class_result = await db.execute(select(func.count(Class.id)))
    total_classes = class_result.scalar()
    
    # Total sessions
    session_result = await db.execute(select(func.count(SessionModel.id)))
    total_sessions = session_result.scalar()
    
    # Active sessions
    active_result = await db.execute(
        select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
    )
    active_sessions = active_result.scalar()
    
    return DashboardStats(
        total_users=total_users,
        total_classes=total_classes,
        total_sessions=total_sessions,
        active_sessions=active_sessions,
        users_by_role=users_by_role
    )
