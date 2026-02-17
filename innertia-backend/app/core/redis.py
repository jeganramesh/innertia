"""
Redis connection and utilities for token blacklisting and caching.
"""

import redis.asyncio as redis
from typing import Optional
from datetime import timedelta

from app.core.config import settings


class RedisClient:
    """Async Redis client wrapper."""
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
    
    async def connect(self) -> None:
        """Connect to Redis."""
        self._client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._client:
            await self._client.close()
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if self._client is None:
            raise RuntimeError("Redis client not connected. Call connect() first.")
        return self._client
    
    # Token Blacklisting Methods
    
    async def blacklist_token(self, token: str, expires_in: timedelta) -> None:
        """
        Add token to blacklist in Redis.
        
        Args:
            token: JWT token to blacklist
            expires_in: Time until token expires
        """
        await self._client.setex(
            f"blacklist:{token}",
            int(expires_in.total_seconds()),
            "1"
        )
    
    async def is_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted.
        
        Args:
            token: JWT token to check
            
        Returns:
            True if token is blacklisted, False otherwise
        """
        result = await self._client.get(f"blacklist:{token}")
        return result is not None
    
    async def remove_from_blacklist(self, token: str) -> None:
        """Remove token from blacklist."""
        await self._client.delete(f"blacklist:{token}")
    
    # Refresh Token Storage
    
    async def store_refresh_token(self, user_id: str, token: str, expires_in: timedelta) -> None:
        """Store refresh token in Redis."""
        await self._client.setex(
            f"refresh:{user_id}:{token}",
            int(expires_in.total_seconds()),
            "1"
        )
    
    async def validate_refresh_token(self, user_id: str, token: str) -> bool:
        """Validate refresh token exists in Redis."""
        return await self._client.exists(f"refresh:{user_id}:{token}") > 0
    
    async def revoke_refresh_token(self, user_id: str, token: str) -> None:
        """Remove refresh token from Redis."""
        await self._client.delete(f"refresh:{user_id}:{token}")
    
    async def revoke_all_user_tokens(self, user_id: str) -> None:
        """Revoke all refresh tokens for a user (pattern deletion)."""
        cursor = 0
        pattern = f"refresh:{user_id}:*"
        while True:
            cursor, keys = await self._client.scan(cursor, match=pattern, count=100)
            if keys:
                await self._client.delete(*keys)
            if cursor == 0:
                break
    
    # Cache Methods
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        return await self._client.get(key)
    
    async def set(self, key: str, value: str, expires_in: Optional[timedelta] = None) -> None:
        """Set value in cache."""
        if expires_in:
            await self._client.setex(key, int(expires_in.total_seconds()), value)
        else:
            await self._client.set(key, value)
    
    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        await self._client.delete(key)


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency to get Redis client."""
    return redis_client
