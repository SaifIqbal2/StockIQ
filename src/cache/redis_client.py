"""Redis cache client for distributed caching."""

import redis.asyncio as redis
from typing import Any, Optional
import json
from loguru import logger
from src.config import settings


class RedisCacheClient:
    """Redis cache client for caching financial data."""

    def __init__(self):
        """Initialize Redis cache client."""
        self.redis = None
        self.ttl = settings.CACHE_TTL

    async def connect(self):
        """Connect to Redis."""
        try:
            logger.info(f"Connecting to Redis: {settings.REDIS_URL}")

            self.redis = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf8",
                decode_responses=True,
            )

            # Test connection
            await self.redis.ping()
            logger.info("✓ Redis connection established")

        except Exception as e:
            logger.error(f"✗ Redis connection failed: {str(e)}")
            raise

    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            logger.info("✓ Redis connection closed")

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache (will be serialized to JSON)
            ttl: Time to live in seconds (uses default if None)

        Returns:
            True if successful
        """
        try:
            if self.redis is None:
                logger.warning("Redis not connected, skipping cache set")
                return False

            # Use provided TTL or default
            cache_ttl = ttl or self.ttl

            # Serialize value to JSON
            json_value = json.dumps(value) if not isinstance(value, str) else value

            await self.redis.setex(key, cache_ttl, json_value)
            logger.debug(f"Cache SET: {key} (TTL: {cache_ttl}s)")
            return True

        except Exception as e:
            logger.error(f"✗ Cache SET error for {key}: {str(e)}")
            return False

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        try:
            if self.redis is None:
                return None

            value = await self.redis.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            else:
                logger.debug(f"Cache MISS: {key}")
                return None

        except Exception as e:
            logger.error(f"✗ Cache GET error for {key}: {str(e)}")
            return None

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if successful
        """
        try:
            if self.redis is None:
                return False

            await self.redis.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True

        except Exception as e:
            logger.error(f"✗ Cache DELETE error for {key}: {str(e)}")
            return False

    async def clear(self, pattern: Optional[str] = None) -> int:
        """
        Clear cache entries.

        Args:
            pattern: Pattern to match keys (e.g., "analysis:*")
                     If None, clears all keys

        Returns:
            Number of deleted keys
        """
        try:
            if self.redis is None:
                return 0

            if pattern:
                keys = await self.redis.keys(pattern)
                if keys:
                    deleted = await self.redis.delete(*keys)
                    logger.info(f"Cache CLEAR: Deleted {deleted} keys matching '{pattern}'")
                    return deleted
            else:
                await self.redis.flushdb()
                logger.info("Cache CLEAR: All keys cleared")
                return -1

            return 0

        except Exception as e:
            logger.error(f"✗ Cache CLEAR error: {str(e)}")
            return 0

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if exists
        """
        try:
            if self.redis is None:
                return False

            exists = await self.redis.exists(key)
            return exists > 0

        except Exception as e:
            logger.error(f"✗ Cache EXISTS error for {key}: {str(e)}")
            return False

    async def get_ttl(self, key: str) -> int:
        """
        Get TTL for a key.

        Args:
            key: Cache key

        Returns:
            TTL in seconds (-1 if no TTL, -2 if not exists)
        """
        try:
            if self.redis is None:
                return -2

            ttl = await self.redis.ttl(key)
            return ttl

        except Exception as e:
            logger.error(f"✗ Cache TTL error for {key}: {str(e)}")
            return -2

    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment integer value in cache.

        Args:
            key: Cache key
            amount: Amount to increment

        Returns:
            New value
        """
        try:
            if self.redis is None:
                return 0

            value = await self.redis.incrby(key, amount)
            logger.debug(f"Cache INCR: {key} += {amount} (new: {value})")
            return value

        except Exception as e:
            logger.error(f"✗ Cache INCR error for {key}: {str(e)}")
            return 0

    async def ping(self) -> bool:
        """
        Ping Redis to check connection.

        Returns:
            True if connection alive
        """
        try:
            if self.redis is None:
                return False

            result = await self.redis.ping()
            return result

        except Exception as e:
            logger.error(f"✗ Cache PING error: {str(e)}")
            return False

    def cache(self, ttl: Optional[int] = None):
        """
        Decorator for caching function results.

        Args:
            ttl: Time to live in seconds

        Returns:
            Decorated function
        """
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # Generate cache key from function name and arguments
                cache_key = f"{func.__name__}:{':'.join(str(arg) for arg in args)}"
                if kwargs:
                    cache_key += f":{':'.join(f'{k}={v}' for k, v in sorted(kwargs.items()))}"

                # Try to get from cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache HIT for {func.__name__}")
                    return cached_value

                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl=ttl)

                return result

            return wrapper

        return decorator


# Global cache client instance
cache_client = RedisCacheClient()
