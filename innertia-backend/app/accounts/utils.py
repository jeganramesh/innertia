"""
Utility functions for authentication.
Handles password hashing, JWT token creation, and token validation.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from uuid import UUID

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============ Password Functions ============

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    # Truncate password to 72 bytes (bcrypt limit)
    return pwd_context.hash(password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password to compare against
        
    Returns:
        True if passwords match, False otherwise
    """
    # Truncate password to 72 bytes (bcrypt limit)
    return pwd_context.verify(plain_password[:72], hashed_password)


# ============ JWT Token Functions ============

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode (should include user_id and role)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    user_id: UUID,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        user_id: User's UUID
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + (
            expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        ),
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    return payload


def verify_token_type(token_payload: dict, expected_type: str) -> bool:
    """
    Verify token type matches expected type.
    
    Args:
        token_payload: Decoded token payload
        expected_type: Expected token type ("access" or "refresh")
        
    Returns:
        True if types match
    """
    return token_payload.get("type") == expected_type


# ============ Token Blacklisting ============

async def add_to_blacklist(token: str, expires_delta: timedelta) -> None:
    """
    Add token to blacklist in Redis.
    
    Args:
        token: JWT token to blacklist
        expires_delta: Token expiration time
    """
    from app.core.redis import redis_client
    await redis_client.blacklist_token(token, expires_delta)


async def is_token_blacklisted(token: str) -> bool:
    """
    Check if token is blacklisted.
    
    Args:
        token: JWT token to check
        
    Returns:
        True if token is blacklisted
    """
    from app.core.redis import redis_client
    return await redis_client.is_blacklisted(token)


# ============ Helper Functions ============

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from token payload.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID string or None
    """
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except JWTError:
        return None


def get_role_from_token(token: str) -> Optional[str]:
    """
    Extract role from token payload.
    
    Args:
        token: JWT token string
        
    Returns:
        Role string or None
    """
    try:
        payload = decode_token(token)
        return payload.get("role")
    except JWTError:
        return None
