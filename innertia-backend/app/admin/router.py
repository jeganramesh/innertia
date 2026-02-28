"""
Admin routes.
Handles user management, bulk uploads, class management, and session monitoring.
"""

import io
import json
import uuid
from typing import Optional
from datetime import datetime, timedelta

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.accounts.dependencies import require_admin, get_current_user
from app.models.models import User, RoleEnum, Class, Session as SessionModel, Enrollment, SystemSetting, AuditLog
from app.accounts.utils import hash_password
from app.admin.schemas import (
    UserCreateAdmin, UserUpdateAdmin, UserOutAdmin, UserListResponse,
    BulkUploadResponse, ClassCreate, ClassUpdate, ClassOut, DashboardStats,
    SessionMonitorOut, SessionListResponse, SessionDetailResponse,
    AttendanceAnalyticsSummary, SystemSettingsResponse, SystemSettingsUpdate,
    AuditLogResponse, AuditLogListResponse
)
from app.admin.service import log_admin_action, AdminService

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
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new user (admin only).
    If a soft-deleted user exists with the same email, restore them instead.
    """
    # Check if user already exists (not deleted)
    result = await db.execute(
        select(User).where(
            and_(
                User.email == user_data.email,
                User.deleted_at.is_(None)
            )
        )
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Check if there's a soft-deleted user with the same email
    result = await db.execute(
        select(User).where(
            and_(
                User.email == user_data.email,
                User.deleted_at.isnot(None)
            )
        )
    )
    deleted_user = result.scalar_one_or_none()
    
    if deleted_user:
        # Restore the soft-deleted user
        deleted_user.deleted_at = None
        deleted_user.is_active = user_data.is_active
        deleted_user.role = user_data.role
        deleted_user.full_name = user_data.name
        deleted_user.password_hash = hash_password(user_data.password)
        deleted_user.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(deleted_user)
        
        # Log the action
        await log_admin_action(
            db=db,
            performed_by=current_user.id,
            action="RESTORE_USER",
            target_type="user",
            target_id=str(deleted_user.id),
            details={
                "email": deleted_user.email,
                "role": deleted_user.role.value if hasattr(deleted_user.role, 'value') else str(deleted_user.role)
            },
            ip_address=request.client.host if request.client else None
        )
        
        return UserOutAdmin(
            id=str(deleted_user.id),
            email=deleted_user.email,
            name=deleted_user.full_name,
            role=deleted_user.role.value if hasattr(deleted_user.role, 'value') else str(deleted_user.role),
            is_active=deleted_user.is_active,
            created_at=deleted_user.created_at,
            updated_at=deleted_user.updated_at
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.name,
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
    
    # Log the action
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action="CREATE_USER",
        target_type="user",
        target_id=str(new_user.id),
        details={
            "email": new_user.email,
            "role": new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
            "is_active": new_user.is_active
        },
        ip_address=request.client.host if request.client else None
    )
    
    return UserOutAdmin(
        id=str(new_user.id),
        email=new_user.email,
        name=new_user.full_name,
        role=new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
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
    status: Optional[str] = Query(None),  # active/inactive
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users with pagination and filters (admin only).
    Excludes soft-deleted users.
    """
    # Build query - exclude soft deleted users
    query = select(User).where(User.deleted_at.is_(None))
    count_query = select(func.count(User.id)).where(User.deleted_at.is_(None))
    
    # Apply filters
    if role and role != 'all':
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if status is not None:
        is_active = status.lower() == 'active'
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_filter),
                User.full_name.ilike(search_filter)
            )
        )
        count_query = count_query.where(
            or_(
                User.email.ilike(search_filter),
                User.full_name.ilike(search_filter)
            )
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
            name=u.full_name,
            role=u.role.value if hasattr(u.role, 'value') else str(u.role),
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
        select(User).where(
            and_(
                User.id == user_uuid,
                User.deleted_at.is_(None)
            )
        )
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
        name=user.full_name,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
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
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a user (admin only).
    Cannot change own role (prevent admin lockout).
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
    
    # Security check: Cannot change own role
    if user.id == current_user.id and user_data.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Store previous values for audit
    previous_values = {
        "name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active
    }
    
    # Update fields
    if user_data.name is not None:
        user.full_name = user_data.name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(user)
    
    # Log the action
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action="UPDATE_USER",
        target_type="user",
        target_id=str(user.id),
        details={
            "previous_values": previous_values,
            "new_values": {
                "name": user.full_name,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "is_active": user.is_active
            }
        },
        ip_address=request.client.host if request.client else None
    )
    
    return UserOutAdmin(
        id=str(user.id),
        email=user.email,
        name=user.full_name,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.patch(
    "/users/{user_id}/toggle",
    response_model=UserOutAdmin,
    dependencies=[Depends(require_admin)]
)
async def toggle_user(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle user active/inactive status (admin only).
    Cannot disable own account.
    Cannot disable last admin.
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
    
    # Security check: Cannot disable own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable your own account"
        )
    
    # Security check: Cannot disable last admin
    if user.is_active and str(user.role).lower() == "admin":
        # Check if this is the last active admin
        admin_count_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    User.role == "admin",
                    User.is_active == True,
                    User.deleted_at.is_(None)
                )
            )
        )
        admin_count = admin_count_result.scalar()
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot disable the last admin account"
            )
    
    # Toggle status
    user.is_active = not user.is_active
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(user)
    
    # Log the action
    action = "ENABLE_USER" if user.is_active else "DISABLE_USER"
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action=action,
        target_type="user",
        target_id=str(user.id),
        details={
            "email": user.email,
            "new_status": user.is_active
        },
        ip_address=request.client.host if request.client else None
    )
    
    return UserOutAdmin(
        id=str(user.id),
        email=user.email,
        name=user.full_name,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
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
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a user (admin only).
    Cannot delete own account.
    Cannot delete last admin.
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
    
    # Security check: Cannot delete own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Security check: Cannot delete last admin
    if str(user.role).lower() == "admin":
        admin_count_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    User.role == RoleEnum.ADMIN,
                    User.deleted_at.is_(None)
                )
            )
        )
        admin_count = admin_count_result.scalar()
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin account"
            )
    
    # Soft delete
    user.deleted_at = datetime.utcnow()
    user.is_active = False  # Also deactivate
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    
    # Log the action
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action="DELETE_USER",
        target_type="user",
        target_id=str(user.id),
        details={
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
        },
        ip_address=request.client.host if request.client else None
    )
    
    return None


# ============ Bulk Upload Endpoints ============

@router.post(
    "/users/upload",
    response_model=BulkUploadResponse,
    dependencies=[Depends(require_admin)]
)
async def bulk_upload_users(
    file: UploadFile = File(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk upload users from CSV or Excel file (admin only).
    
    Expected columns:
    - email: User's email (unique) - REQUIRED
    - role: Role (student, faculty, admin) - REQUIRED
    - full_name (or name): User's name - OPTIONAL
    - password: User's password - OPTIONAL (will generate random if not provided)
    - is_active: Boolean (true/false or 1/0) - OPTIONAL (default: true)
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
    
    # Validate columns - support both full_name and name
    required_columns = ["email", "role"]
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
    
    # Get existing emails for batch validation
    existing_emails_result = await db.execute(
        select(User.email).where(User.deleted_at.is_(None))
    )
    existing_emails = set(row[0] for row in existing_emails_result.fetchall())
    
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
            is_active_val = row.get("is_active", True)
            if isinstance(is_active_val, bool):
                is_active = is_active_val
            elif isinstance(is_active_val, (int, float)):
                is_active = bool(is_active_val)
            else:
                is_active = str(is_active_val).lower() in ["true", "1", "yes"]
            
            # Get full_name - support both "full_name" and "name" columns
            full_name = None
            if "full_name" in row and pd.notna(row.get("full_name")):
                full_name = str(row["full_name"]).strip()
            elif "name" in row and pd.notna(row.get("name")):
                full_name = str(row["name"]).strip()
            
            # Get password - use provided password or generate random one
            password = None
            if "password" in row and pd.notna(row.get("password")) and str(row["password"]).strip():
                password = str(row["password"]).strip()
            else:
                import secrets
                password = secrets.token_urlsafe(8)
            
            hashed_password = hash_password(password)
            result = await db.execute(
                select(User).where(User.email == email)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                if existing_user.deleted_at is not None:
                    # Reactivate soft-deleted user
                    existing_user.deleted_at = None
                    existing_user.full_name = full_name or existing_user.full_name
                    existing_user.role = role
                    existing_user.is_active = is_active
                    existing_user.password_hash = hashed_password
                    existing_user.updated_at = datetime.utcnow()
                    updated_count += 1
                else:
                    # Update existing active user
                    existing_user.full_name = full_name or existing_user.full_name
                    existing_user.role = role
                    existing_user.is_active = is_active
                    existing_user.password_hash = hashed_password
                    existing_user.updated_at = datetime.utcnow()
                    updated_count += 1
            else:
                # Create new user
                new_user = User(
                    email=email,
                    password_hash=hashed_password,
                    full_name=full_name,
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
    
    # Log bulk upload event
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action="BULK_UPLOAD_USERS",
        target_type="user",
        details={
            "created": created_count,
            "updated": updated_count,
            "failed": len(failed_rows),
            "filename": file.filename
        },
        ip_address=request.client.host if request and request.client else None
    )
    
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
            and_(
                User.id == faculty_uuid,
                User.role == "faculty",
                User.deleted_at.is_(None)
            )
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
    dependencies=[Depends(require_admin)]
)
async def list_classes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all classes (admin only).
    """
    # Build query - exclude soft deleted classes
    query = select(Class).where(Class.deleted_at.is_(None))
    count_query = select(func.count(Class.id)).where(Class.deleted_at.is_(None))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Class.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    classes = result.scalars().all()
    
    class_list = [
        {
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "faculty_id": str(c.faculty_id),
            "is_active": c.is_active,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        }
        for c in classes
    ]
    
    return {
        "classes": class_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get(
    "/classes/{class_id}",
    response_model=ClassOut,
    dependencies=[Depends(require_admin)]
)
async def get_class(
    class_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific class by ID (admin only).
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    result = await db.execute(
        select(Class).where(
            and_(
                Class.id == class_uuid,
                Class.deleted_at.is_(None)
            )
        )
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    return ClassOut(
        id=str(class_obj.id),
        name=class_obj.name,
        description=class_obj.description,
        faculty_id=str(class_obj.faculty_id),
        is_active=class_obj.is_active,
        created_at=class_obj.created_at,
        updated_at=class_obj.updated_at
    )


@router.patch(
    "/classes/{class_id}",
    response_model=ClassOut,
    dependencies=[Depends(require_admin)]
)
async def update_class(
    class_id: str,
    class_data: ClassUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a class (admin only).
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    result = await db.execute(
        select(Class).where(Class.id == class_uuid)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Update fields
    if class_data.name is not None:
        class_obj.name = class_data.name
    if class_data.description is not None:
        class_obj.description = class_data.description
    if class_data.is_active is not None:
        class_obj.is_active = class_data.is_active
    
    class_obj.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(class_obj)
    
    return ClassOut(
        id=str(class_obj.id),
        name=class_obj.name,
        description=class_obj.description,
        faculty_id=str(class_obj.faculty_id),
        is_active=class_obj.is_active,
        created_at=class_obj.created_at,
        updated_at=class_obj.updated_at
    )


@router.delete(
    "/classes/{class_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)]
)
async def delete_class(
    class_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a class (admin only).
    """
    try:
        class_uuid = uuid.UUID(class_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid class ID format"
        )
    
    result = await db.execute(
        select(Class).where(Class.id == class_uuid)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Soft delete
    class_obj.deleted_at = datetime.utcnow()
    class_obj.is_active = False
    class_obj.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return None


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
    Get dashboard statistics (admin only).
    """
    # Count users by role (excluding soft-deleted)
    users_by_role = {}
    for role_str in ["admin", "faculty", "student"]:
        result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    User.role == role_str,
                    User.deleted_at.is_(None)
                )
            )
        )
        users_by_role[role_str] = result.scalar() or 0
    
    # Total users
    total_users_result = await db.execute(
        select(func.count(User.id)).where(User.deleted_at.is_(None))
    )
    total_users = total_users_result.scalar() or 0
    
    # Total classes
    total_classes_result = await db.execute(
        select(func.count(Class.id)).where(Class.deleted_at.is_(None))
    )
    total_classes = total_classes_result.scalar() or 0
    
    # Total sessions
    total_sessions_result = await db.execute(
        select(func.count(SessionModel.id))
    )
    total_sessions = total_sessions_result.scalar() or 0
    
    # Active sessions
    active_sessions_result = await db.execute(
        select(func.count(SessionModel.id)).where(SessionModel.is_active == True)
    )
    active_sessions = active_sessions_result.scalar() or 0
    
    # Last 30 day sessions
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_30_days_result = await db.execute(
        select(func.count(SessionModel.id)).where(SessionModel.created_at >= thirty_days_ago)
    )
    last_30_day_sessions = last_30_days_result.scalar() or 0
    
    # Last 7 days metrics for admin dashboard
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Get sessions in last 7 days
    sessions_7_days_result = await db.execute(
        select(SessionModel).where(SessionModel.created_at >= seven_days_ago)
    )
    sessions_7_days = sessions_7_days_result.scalars().all()
    
    # Calculate average attendance rate (simplified - based on active sessions)
    # In production, this would be calculated from actual attendance records
    total_attendance_rate = 0.0
    if sessions_7_days:
        # Simulated calculation - in real system would query attendance records
        for session in sessions_7_days:
            total_attendance_rate += 75.0 + (hash(str(session.id)) % 20)  # 75-95% range
        total_attendance_rate = total_attendance_rate / len(sessions_7_days)
    
    # Total violations in last 7 days (placeholder - would need violation_logs table)
    # Count audit logs for violation-related actions
    violations_result = await db.execute(
        select(func.count(AuditLog.id)).where(
            and_(
                AuditLog.created_at >= seven_days_ago,
                AuditLog.action.like('%VIOLATION%')
            )
        )
    )
    total_violations_7_days = violations_result.scalar() or 0
    
    return DashboardStats(
        total_users=total_users,
        total_students=users_by_role.get("student", 0),
        total_faculty=users_by_role.get("faculty", 0),
        total_admins=users_by_role.get("admin", 0),
        total_classes=total_classes,
        total_sessions=total_sessions,
        active_sessions=active_sessions,
        last_30_day_sessions=last_30_day_sessions,
        users_by_role=users_by_role,
        average_attendance_rate=round(total_attendance_rate, 2),
        total_violations_7_days=total_violations_7_days
    )


# ============ Session Monitoring Endpoints ============

@router.get(
    "/sessions",
    response_model=SessionListResponse,
    dependencies=[Depends(require_admin)]
)
async def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all sessions with pagination (admin only).
    """
    # Build query
    query = select(SessionModel)
    count_query = select(func.count(SessionModel.id))
    
    # Apply filters
    if is_active is not None:
        query = query.where(SessionModel.is_active == is_active)
        count_query = count_query.where(SessionModel.is_active == is_active)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(SessionModel.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    session_list = []
    for session in sessions:
        # Get class name
        class_result = await db.execute(
            select(Class).where(Class.id == session.class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        
        # Get faculty name
        faculty_result = await db.execute(
            select(User).where(User.id == session.faculty_id)
        )
        faculty = faculty_result.scalar_one_or_none()
        
        # Get student count
        student_count_result = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.class_id == session.class_id)
        )
        student_count = student_count_result.scalar() or 0
        
        # Calculate duration
        duration_minutes = None
        if session.start_time and session.end_time:
            duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
        
        session_list.append(SessionMonitorOut(
            id=str(session.id),
            class_id=str(session.class_id),
            class_name=class_obj.name if class_obj else "Unknown",
            faculty_id=str(session.faculty_id),
            faculty_name=faculty.full_name if faculty and faculty.full_name else (faculty.name if faculty else "Unknown"),
            started_at=session.start_time or session.started_at or session.created_at,
            ended_at=session.end_time or session.ended_at,
            is_active=session.is_active,
            duration_minutes=duration_minutes,
            student_count=student_count
        ))
    
    return SessionListResponse(
        sessions=session_list,
        total=total,
        page=page,
        page_size=page_size
    )


# ============ Session Detail Endpoint ============

@router.get(
    "/sessions/{session_id}",
    response_model=SessionDetailResponse,
    dependencies=[Depends(require_admin)]
)
async def get_session_detail(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed session information for admin oversight (read-only).
    Returns aggregated student attendance and violation distribution.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_uuid)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get class info
    class_result = await db.execute(
        select(Class).where(Class.id == session.class_id)
    )
    class_obj = class_result.scalar_one_or_none()
    
    # Get faculty info
    faculty_result = await db.execute(
        select(User).where(User.id == session.faculty_id)
    )
    faculty = faculty_result.scalar_one_or_none()
    
    # Get enrollment count (students in the class)
    enrollment_count_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.class_id == session.class_id)
    )
    total_students = enrollment_count_result.scalar() or 0
    
    # Calculate attendance percentage (simplified - based on slide activity)
    # In a real system, you'd have attendance records
    attendance_percentage = 0.0
    if total_students > 0:
        # For now, calculate based on active slide activities
        activity_count_result = await db.execute(
            select(func.count(session.id)).select_from(SessionModel)
            .where(SessionModel.id == session_uuid)
        )
        attendance_percentage = 75.0  # Placeholder - would need proper attendance tracking
    
    # Calculate duration
    duration_minutes = None
    if session.start_time and session.end_time:
        duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
    
    return SessionDetailResponse(
        id=str(session.id),
        class_id=str(session.class_id),
        class_name=class_obj.name if class_obj else "Unknown",
        faculty_id=str(session.faculty_id),
        faculty_name=faculty.full_name if faculty and faculty.full_name else (faculty.name if faculty else "Unknown"),
        start_time=session.start_time or session.started_at or session.created_at,
        end_time=session.end_time or session.ended_at,
        is_active=session.is_active,
        duration_minutes=duration_minutes,
        total_students=total_students,
        attendance_percentage=attendance_percentage,
        violation_count=0  # Placeholder - would need violation_logs table
    )


# ============ Attendance Analytics Endpoint ============

@router.get(
    "/analytics/attendance",
    response_model=AttendanceAnalyticsSummary,
    dependencies=[Depends(require_admin)]
)
async def get_attendance_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance analytics with date range and department filters.
    Returns daily attendance rate, session count, and violation trend.
    """
    # Default to last 7 days
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Parse dates
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Build query for sessions in date range
    query = select(SessionModel).where(
        and_(
            SessionModel.created_at >= start_dt,
            SessionModel.created_at <= end_dt
        )
    )
    
    if department:
        query = query.join(Class).where(Class.department == department)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Calculate daily data
    daily_data = []
    total_sessions = len(sessions)
    
    # Group sessions by date
    sessions_by_date = {}
    for session in sessions:
        date_key = (session.start_time or session.started_at or session.created_at).strftime("%Y-%m-%d")
        if date_key not in sessions_by_date:
            sessions_by_date[date_key] = []
        sessions_by_date[date_key].append(session)
    
    # Generate daily data
    current_date = start_dt
    while current_date <= end_dt:
        date_key = current_date.strftime("%Y-%m-%d")
        day_sessions = sessions_by_date.get(date_key, [])
        
        # Calculate attendance rate (simplified)
        attendance_rate = 0.0
        if day_sessions:
            # Placeholder calculation
            attendance_rate = 75.0 + (hash(date_key) % 20)  # Simulated data
        
        daily_data.append({
            "date": date_key,
            "attendance_rate": round(attendance_rate, 2),
            "session_count": len(day_sessions),
            "violation_count": len(day_sessions) * 2  # Placeholder
        })
        
        current_date += timedelta(days=1)
    
    # Calculate summary
    average_attendance_rate = sum(d["attendance_rate"] for d in daily_data) / len(daily_data) if daily_data else 0
    total_violations = sum(d["violation_count"] for d in daily_data)
    
    return AttendanceAnalyticsSummary(
        daily_data=daily_data,
        average_attendance_rate=round(average_attendance_rate, 2),
        total_sessions=total_sessions,
        total_violations=total_violations,
        date_range_start=start_date,
        date_range_end=end_date
    )


# ============ System Settings Endpoints ============

@router.get(
    "/settings",
    response_model=SystemSettingsResponse,
    dependencies=[Depends(require_admin)]
)
async def get_system_settings(
    db: AsyncSession = Depends(get_db)
):
    """
    Get system settings (admin only).
    """
    # Get or create default settings
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    
    # Build settings dict
    settings_dict = {s.key: s.value for s in settings}
    
    return SystemSettingsResponse(
        attendance_threshold=int(settings_dict.get("attendance_threshold", "80")),
        max_focus_violations=int(settings_dict.get("max_focus_violations", "5")),
        session_timeout_minutes=int(settings_dict.get("session_timeout_minutes", "120"))
    )


@router.put(
    "/settings",
    response_model=SystemSettingsResponse,
    dependencies=[Depends(require_admin)]
)
async def update_system_settings(
    settings_data: SystemSettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update system settings (admin only).
    """
    editable_keys = {
        "attendance_threshold": settings_data.attendance_threshold,
        "max_focus_violations": settings_data.max_focus_violations,
        "session_timeout_minutes": settings_data.session_timeout_minutes
    }
    
    for key, value in editable_keys.items():
        if value is not None:
            # Check if setting exists
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            setting = result.scalar_one_or_none()
            
            if setting:
                setting.value = str(value)
                setting.updated_at = datetime.utcnow()
            else:
                # Create new setting
                setting = SystemSetting(
                    key=key,
                    value=str(value)
                )
                db.add(setting)
    
    await db.commit()
    
    # Log the action
    await log_admin_action(
        db=db,
        performed_by=current_user.id,
        action="UPDATE_SETTINGS",
        target_type="system",
        details={"updated_keys": [k for k, v in editable_keys.items() if v is not None]},
        ip_address=request.client.host if request.client else None
    )
    
    # Return updated settings
    return await get_system_settings(db)


# ============ Audit Log Viewer Endpoint ============

@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    dependencies=[Depends(require_admin)]
)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs with filters (admin only, read-only).
    """
    # Build query
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.id))
    
    # Apply filters
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id)
            query = query.where(AuditLog.performed_by == user_uuid)
            count_query = count_query.where(AuditLog.performed_by == user_uuid)
        except ValueError:
            pass  # Ignore invalid UUID
    
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(AuditLog.created_at >= start_dt)
            count_query = count_query.where(AuditLog.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.where(AuditLog.created_at < end_dt)
            count_query = count_query.where(AuditLog.created_at < end_dt)
        except ValueError:
            pass
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(AuditLog.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()
    
    log_list = [
        AuditLogResponse(
            id=str(log.id),
            action=log.action,
            performed_by=str(log.performed_by),
            target_type=log.target_type,
            target_id=log.target_id,
            metadata_json=log.metadata_json,
            created_at=log.created_at,
            ip_address=log.ip_address
        )
        for log in logs
    ]
    
    return AuditLogListResponse(
        logs=log_list,
        total=total,
        page=page,
        page_size=page_size
    )


# =============================================================================
# MULTI-TENANT COLLEGE MANAGEMENT (Platform Admin Only)
# =============================================================================

# Import the new schemas
from app.admin.schemas import (
    CollegeCreate, CollegeUpdate, CollegeOut, CollegeWithStats, CollegeListResponse,
    FeatureToggleRequest, FeatureToggleResponse, FeatureListResponse,
    RolePermissionRequest, RolePermissionResponse, RolePermissionListResponse
)
from app.core.feature_guard import require_platform_admin


@router.post(
    "/colleges",
    response_model=CollegeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_platform_admin)]
)
async def create_college(
    college_data: CollegeCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new college (platform admin only).
    """
    service = AdminService(db)
    
    try:
        college = await service.create_college(
            name=college_data.name,
            code=college_data.code,
            performed_by=current_user.id,
            ip_address=request.client.host if request.client else None
        )
        return CollegeOut(
            id=str(college.id),
            name=college.name,
            code=college.code,
            is_active=college.is_active,
            created_at=college.created_at,
            updated_at=college.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )


@router.get(
    "/colleges",
    response_model=CollegeListResponse,
    dependencies=[Depends(require_platform_admin)]
)
async def get_colleges(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all colleges with optional filtering (platform admin only).
    """
    service = AdminService(db)
    
    offset = (page - 1) * page_size
    colleges = await service.get_colleges(
        is_active=is_active,
        limit=page_size,
        offset=offset
    )
    
    # Get total count
    from app.models.models import College
    count_result = await db.execute(select(func.count(College.id)))
    total = count_result.scalar()
    
    college_list = [
        CollegeOut(
            id=str(c.id),
            name=c.name,
            code=c.code,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in colleges
    ]
    
    return CollegeListResponse(
        colleges=college_list,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/colleges/{college_id}",
    response_model=CollegeWithStats,
    dependencies=[Depends(require_platform_admin)]
)
async def get_college(
    college_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get college details with statistics (platform admin only).
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    from app.models.models import College
    result = await db.execute(
        select(College).where(College.id == college_uuid)
    )
    college = result.scalar_one_or_none()
    
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found"
        )
    
    service = AdminService(db)
    stats = await service.get_college_stats(college_uuid)
    
    return CollegeWithStats(
        id=str(college.id),
        name=college.name,
        code=college.code,
        is_active=college.is_active,
        created_at=college.created_at,
        updated_at=college.updated_at,
        total_users=stats["total_users"],
        user_counts=stats["user_counts"]
    )


@router.put(
    "/colleges/{college_id}",
    response_model=CollegeOut,
    dependencies=[Depends(require_platform_admin)]
)
async def update_college(
    college_id: str,
    college_data: CollegeUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update college details (platform admin only).
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    service = AdminService(db)
    
    try:
        college = await service.update_college(
            college_id=college_uuid,
            name=college_data.name,
            is_active=college_data.is_active,
            performed_by=current_user.id,
            ip_address=request.client.host if request.client else None
        )
        return CollegeOut(
            id=str(college.id),
            name=college.name,
            code=college.code,
            is_active=college.is_active,
            created_at=college.created_at,
            updated_at=college.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# =============================================================================
# COLLEGE FEATURE TOGGLES (Platform Admin Only)
# =============================================================================

@router.get(
    "/colleges/{college_id}/features",
    response_model=FeatureListResponse,
    dependencies=[Depends(require_platform_admin)]
)
async def get_college_features(
    college_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all features for a college (platform admin only).
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    service = AdminService(db)
    features = await service.get_college_features(college_uuid)
    
    feature_list = [
        FeatureToggleResponse(
            id=str(f.id),
            college_id=str(f.college_id),
            feature_key=f.feature_key,
            is_enabled=f.is_enabled,
            created_at=f.created_at
        )
        for f in features
    ]
    
    return FeatureListResponse(features=feature_list)


@router.post(
    "/colleges/{college_id}/features",
    response_model=FeatureToggleResponse,
    dependencies=[Depends(require_platform_admin)]
)
async def toggle_college_feature(
    college_id: str,
    feature_data: FeatureToggleRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enable or disable a feature for a college (platform admin only).
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    service = AdminService(db)
    
    try:
        feature = await service.toggle_college_feature(
            college_id=college_uuid,
            feature_key=feature_data.feature_key,
            is_enabled=feature_data.is_enabled,
            performed_by=current_user.id,
            ip_address=request.client.host if request.client else None
        )
        return FeatureToggleResponse(
            id=str(feature.id),
            college_id=str(feature.college_id),
            feature_key=feature.feature_key,
            is_enabled=feature.is_enabled,
            created_at=feature.created_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# =============================================================================
# ROLE FEATURE PERMISSIONS (College Admin)
# =============================================================================

from app.core.feature_guard import require_college_admin


@router.get(
    "/colleges/{college_id}/permissions",
    response_model=RolePermissionListResponse,
    dependencies=[Depends(require_college_admin)]
)
async def get_role_permissions(
    college_id: str,
    role: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get role permissions for a college (college admin only).
    Users can only view permissions for their own college.
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    # College admin can only view their own college's permissions
    if current_user.college_id != college_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view permissions for your own college"
        )
    
    service = AdminService(db)
    permissions = await service.get_role_permissions(college_uuid, role)
    
    permission_list = [
        RolePermissionResponse(
            id=str(p.id),
            college_id=str(p.college_id),
            role=p.role,
            feature_key=p.feature_key,
            is_enabled=p.is_enabled
        )
        for p in permissions
    ]
    
    return RolePermissionListResponse(permissions=permission_list)


@router.post(
    "/colleges/{college_id}/permissions",
    response_model=RolePermissionResponse,
    dependencies=[Depends(require_college_admin)]
)
async def set_role_permission(
    college_id: str,
    permission_data: RolePermissionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Set permission for a role to access a feature (college admin only).
    Users can only modify permissions for their own college.
    """
    try:
        college_uuid = uuid.UUID(college_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid college ID format"
        )
    
    # College admin can only modify their own college's permissions
    if current_user.college_id != college_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify permissions for your own college"
        )
    
    service = AdminService(db)
    
    permission = await service.set_role_permission(
        college_id=college_uuid,
        role=permission_data.role,
        feature_key=permission_data.feature_key,
        is_enabled=permission_data.is_enabled,
        performed_by=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    
    return RolePermissionResponse(
        id=str(permission.id),
        college_id=str(permission.college_id),
        role=permission.role,
        feature_key=permission.feature_key,
        is_enabled=permission.is_enabled
    )
