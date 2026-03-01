"""
Authentication routes.
Handles user registration, login, token refresh, logout, and user info.
"""

from datetime import timedelta
from uuid import UUID
from jose import JWTError
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.redis import redis_client
from app.core.config import settings
from app.models.models import User, RefreshToken, College
from app.accounts.schemas import (
    UserCreate, UserLogin, UserOut, Token,
    TokenRefresh, MessageResponse, ErrorResponse
)
from app.accounts.utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, is_token_blacklisted
)
from app.accounts.dependencies import (
    get_current_user, get_current_active_user,
    get_user_by_email, create_user_response
)
from app.accounts.schemas import TokenPayload


router = APIRouter(prefix="/accounts", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        409: {"model": ErrorResponse, "description": "User already exists"}
    }
)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: Valid email address (unique)
    - **password**: At least 8 characters
    - **name**: Optional name
    - **role**: Optional role (student/faculty/admin) - defaults to student
    """
    # Check if user already exists
    existing_user = await get_user_by_email(user_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Determine role (auto-assign if not provided)
    role = user_data.role or "student"
    
    # Validate role
    valid_roles = ["student", "faculty", "admin", "college_admin", "staff", "trainer"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role=role
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
    
    return create_user_response(new_user)


@router.post(
    "/login",
    response_model=Token,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        403: {"model": ErrorResponse, "description": "Account disabled"}
    }
)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: User's email address
    - **password**: User's password
    """
    # Get user by email
    user = await get_user_by_email(credentials.email, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact administrator."
        )
    
    # Check if user's college is active (skip for platform admin)
    if user.role != "admin" and user.college_id:
        # Query college directly to avoid lazy loading issues
        result = await db.execute(
            select(College).where(College.id == user.college_id)
        )
        college = result.scalar_one_or_none()
        if college and not college.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="College is inactive. Contact platform admin."
            )
    
    # Create tokens
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
    )
    
    refresh_token = create_refresh_token(user_id=user.id)
    
    # Store refresh token in Redis
    await redis_client.store_refresh_token(
        user_id=str(user.id),
        token=refresh_token,
        expires_in=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post(
    "/refresh",
    response_model=Token,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"}
    }
)
async def refresh_token(token_refresh: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid refresh token
    """
    try:
        payload = decode_token(token_refresh.refresh_token)
        token_data = TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token type
    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = token_data.sub
    
    # Validate refresh token exists in Redis
    is_valid = await redis_client.validate_refresh_token(
        user_id=user_id,
        token=token_refresh.refresh_token
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert string UUID to UUID object for SQLAlchemy
    try:
        user_id_uuid = UUID(user_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    result = await db.execute(
        select(User).options(selectinload(User.college)).where(User.id == user_id_uuid)
    )
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user's college is active (skip for platform admin)
    if user.role != "admin" and user.college_id and user.college:
        if not user.college.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="College is inactive. Contact platform admin."
            )
    
    # Create new tokens
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
    )
    
    new_refresh_token = create_refresh_token(user_id=user.id)
    
    # Revoke old refresh token and store new one
    await redis_client.revoke_refresh_token(
        user_id=user_id,
        token=token_refresh.refresh_token
    )
    await redis_client.store_refresh_token(
        user_id=user_id,
        token=new_refresh_token,
        expires_in=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"}
    }
)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout user by blacklisting their access token and revoking refresh token.
    """
    # Get the authorization header
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ")[1]
        
        # Blacklist access token
        await redis_client.blacklist_token(
            token=access_token,
            expires_in=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    
    # Revoke all refresh tokens for the user
    await redis_client.revoke_all_user_tokens(user_id=str(current_user.id))
    
    return None


@router.get(
    "/me",
    response_model=UserOut,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"}
    }
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user's information.
    """
    # Load college relationship if user has college_id
    if current_user.college_id:
        result = await db.execute(
            select(User).options(selectinload(User.college)).where(User.id == current_user.id)
        )
        current_user = result.scalar_one()
    
    return create_user_response(current_user)


@router.get(
    "/me/features",
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"}
    }
)
async def get_user_features(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get enabled features for the current user's role and college.
    
    This endpoint provides the feature list for frontend dynamic navigation.
    Admins see all features, other roles see only enabled features.
    """
    from app.core.feature_guard import FeatureGuard, PLATFORM_FEATURES
    
    # If no college (should only be admin), return all features
    if not current_user.college_id:
        return {
            "features": PLATFORM_FEATURES,
            "college_id": None,
            "role": current_user.role
        }
    
    guard = FeatureGuard(db, current_user)
    enabled_features = await guard.get_enabled_features()
    
    return {
        "features": enabled_features,
        "college_id": str(current_user.college_id),
        "role": current_user.role
    }
