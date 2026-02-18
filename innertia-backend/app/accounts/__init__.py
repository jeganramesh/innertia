"""Accounts module for authentication."""

from app.models.models import User, RefreshToken
from app.accounts.schemas import (
    UserCreate, UserLogin, UserOut, UserUpdate,
    Token, TokenRefresh, TokenPayload,
    MessageResponse, ErrorResponse
)
from app.accounts.utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, is_token_blacklisted
)
from app.accounts.dependencies import (
    get_current_user, get_current_active_user,
    require_roles, require_admin
)

__all__ = [
    "User",
    "RefreshToken",
    "UserCreate",
    "UserLogin",
    "UserOut",
    "UserUpdate",
    "Token",
    "TokenRefresh",
    "TokenPayload",
    "MessageResponse",
    "ErrorResponse",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "is_token_blacklisted",
    "get_current_user",
    "get_current_active_user",
    "require_roles",
    "require_admin",
]
