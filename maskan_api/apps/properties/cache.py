import hashlib
import json
from typing import Any, Optional

from decouple import config
from upstash_redis import Redis

KEY_PREFIX = "maskan"

_redis_client: Optional[Redis] = None


def get_redis_client() -> Redis:
    global _redis_client
    if _redis_client is None:
        url = config("UPSTASH_REDIS_REST_URL", default="")
        token = config("UPSTASH_REDIS_REST_TOKEN", default="")
        if url and token:
            _redis_client = Redis(url=url, token=token)
        else:
            raise RuntimeError(
                "Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
            )
    return _redis_client


def _serialize(data: Any) -> str:
    return json.dumps(data, default=str, ensure_ascii=False)


def _deserialize(data: Optional[str]) -> Optional[Any]:
    if data is None:
        return None
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError):
        return None


def _hash_filters(filters: dict) -> str:
    normalized = {k: v for k, v in filters.items() if v is not None and v != ""}
    if not normalized:
        return "default"
    serialized = json.dumps(normalized, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()[:16]


def _serialize_page(page: int) -> str:
    return f"page_{page}"


CACHE_TTL_PROPERTY_LIST = config("CACHE_TTL_PROPERTY_LIST", default=300, cast=int)
CACHE_TTL_FEATURED = config("CACHE_TTL_FEATURED", default=600, cast=int)
CACHE_TTL_CITIES_REGIONS = config("CACHE_TTL_CITIES_REGIONS", default=3600, cast=int)
CACHE_TTL_MAP_PINS = config("CACHE_TTL_MAP_PINS", default=300, cast=int)
CACHE_TTL_MY_PROPERTIES = config("CACHE_TTL_MY_PROPERTIES", default=300, cast=int)

CACHE_KEYS_SET = "cache_keys"


def get_property_list_cache_key(filters: dict, page: int = 1) -> str:
    filters_hash = _hash_filters(filters)
    return f"{KEY_PREFIX}:properties:list:{filters_hash}:{_serialize_page(page)}"


def get_featured_cache_key() -> str:
    return f"{KEY_PREFIX}:properties:featured"


def get_cities_cache_key() -> str:
    return f"{KEY_PREFIX}:properties:cities"


def get_regions_cache_key() -> str:
    return f"{KEY_PREFIX}:properties:regions"


def get_map_pins_cache_key(filters: dict) -> str:
    filters_hash = _hash_filters(filters)
    return f"{KEY_PREFIX}:properties:map:{filters_hash}"


def get_my_properties_cache_key(user_id: str, filters: dict, page: int = 1) -> str:
    filters_hash = _hash_filters(filters)
    return f"{KEY_PREFIX}:properties:my:{user_id}:{filters_hash}:{_serialize_page(page)}"


def _track_cache_key(redis: Redis, key: str, category: str = "properties:list") -> None:
    redis.sadd(f"cache_keys:{category}", key)


def _get_cache_keys(redis: Redis, category: str) -> list[str]:
    return list(redis.smembers(f"cache_keys:{category}"))


def _delete_cache_keys(redis: Redis, category: str) -> None:
    keys = _get_cache_keys(redis, category)
    if keys:
        redis.delete(*keys)
    redis.delete(f"cache_keys:{category}")


def get_cached(key: str) -> Optional[Any]:
    try:
        redis = get_redis_client()
        data = redis.get(key)
        return _deserialize(data)
    except RuntimeError:
        return None
    except Exception:
        return None


def set_cached(key: str, data: Any, ttl: int, category: str = "properties:list") -> bool:
    try:
        redis = get_redis_client()
        redis.set(key, _serialize(data), ex=ttl)
        _track_cache_key(redis, key, category)
        return True
    except RuntimeError:
        return False
    except Exception:
        return False


def invalidate_property_cache(property_id: str) -> None:
    try:
        redis = get_redis_client()
        redis.delete(f"{KEY_PREFIX}:properties:detail:{property_id}")
    except RuntimeError:
        pass
    except Exception:
        pass


def invalidate_all_properties_cache() -> None:
    try:
        redis = get_redis_client()
        _delete_cache_keys(redis, "properties:list")
        _delete_cache_keys(redis, "properties:featured")
        _delete_cache_keys(redis, "properties:cities")
        _delete_cache_keys(redis, "properties:regions")
        _delete_cache_keys(redis, "properties:map")
        _delete_cache_keys(redis, "properties:my")
    except RuntimeError:
        pass
    except Exception:
        pass


def invalidate_my_properties_cache(user_id: str) -> None:
    try:
        redis = get_redis_client()
        keys = _get_cache_keys(redis, "properties:my")
        for key in keys:
            if f":my:{user_id}:" in key:
                redis.delete(key)
        remaining = [k for k in keys if f":my:{user_id}:" not in k]
        redis.delete(f"cache_keys:properties:my")
        if remaining:
            redis.sadd(f"cache_keys:properties:my", *remaining)
    except RuntimeError:
        pass
    except Exception:
        pass


def check_rate_limit(ip: str, limit: int, window: int = 60) -> tuple[bool, int]:
    try:
        redis = get_redis_client()
        key = f"{KEY_PREFIX}:ratelimit:{ip}"
        current = redis.get(key)
        if current is None:
            redis.setex(key, window, "1")
            return True, limit - 1
        count = int(current)
        if count >= limit:
            return False, 0
        redis.incr(key)
        return True, limit - count - 1
    except RuntimeError:
        return True, limit
    except Exception:
        return True, limit


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")
