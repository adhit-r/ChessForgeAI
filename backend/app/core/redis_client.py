import redis
from app.config import settings
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Create Redis client
redis_client = redis.Redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True,
)


def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """Set a value in cache with expiration"""
    try:
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        redis_client.setex(key, expire, value)
        return True
    except Exception as e:
        logger.error(f"Failed to set cache key {key}: {e}")
        return False


def get_cache(key: str) -> Optional[Any]:
    """Get a value from cache"""
    try:
        value = redis_client.get(key)
        if value is None:
            return None
        
        # Try to parse as JSON
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    except Exception as e:
        logger.error(f"Failed to get cache key {key}: {e}")
        return None


def delete_cache(key: str) -> bool:
    """Delete a key from cache"""
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to delete cache key {key}: {e}")
        return False


def update_analysis_progress(user_id: int, progress_data: Dict[str, Any]) -> bool:
    """Update analysis progress for a user"""
    try:
        key = f"analysis_progress:{user_id}"
        redis_client.hset(key, mapping=progress_data)
        redis_client.expire(key, 86400)  # 24 hours
        return True
    except Exception as e:
        logger.error(f"Failed to update analysis progress for user {user_id}: {e}")
        return False


def get_analysis_progress(user_id: int) -> Optional[Dict[str, Any]]:
    """Get analysis progress for a user"""
    try:
        key = f"analysis_progress:{user_id}"
        progress = redis_client.hgetall(key)
        if not progress:
            return None
        
        # Convert string values to appropriate types
        result = {}
        for k, v in progress.items():
            if k in ['games_total', 'games_completed', 'games_failed']:
                result[k] = int(v)
            elif k in ['percentage']:
                result[k] = float(v)
            else:
                result[k] = v
        
        return result
    except Exception as e:
        logger.error(f"Failed to get analysis progress for user {user_id}: {e}")
        return None


def clear_analysis_progress(user_id: int) -> bool:
    """Clear analysis progress for a user"""
    try:
        key = f"analysis_progress:{user_id}"
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to clear analysis progress for user {user_id}: {e}")
        return False


def test_redis_connection() -> bool:
    """Test Redis connection"""
    try:
        redis_client.ping()
        logger.info("Redis connection successful")
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False
