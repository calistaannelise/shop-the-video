"""Caching layer: Redis with an in-process LRU fallback. Owner: Person A.

A search is: CLIP embed (~100ms) -> vector lookup -> LLM re-rank. We cache the
query embedding and the final response so repeat queries skip all of that work.
Redis is the shared backend; if it's unreachable (not running, wrong URL) we fall
back to an in-process LRU dict, so the backend never hard-depends on it.

Values are opaque bytes: callers encode/decode (JSON string, float32 vector, ...).
"""
import os
from collections import OrderedDict

_MAX_LOCAL = 1024  # cap on in-process fallback entries
_DEFAULT_TTL = 3600  # 1 hour


class Cache:
    def __init__(self, url: str | None = None):
        self.backend = "memory"
        self._redis = None
        self._local: "OrderedDict[str, bytes]" = OrderedDict()
        url = url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis

            client = redis.Redis.from_url(url, socket_connect_timeout=0.5)
            client.ping()  # fail fast if Redis isn't actually reachable
            self._redis = client
            self.backend = "redis"
        except Exception:
            self._redis = None  # stay on the in-process fallback

    def get(self, key: str) -> bytes | None:
        if self._redis is not None:
            try:
                return self._redis.get(key)
            except Exception:
                pass  # degrade to local on a live Redis error
        val = self._local.get(key)
        if val is not None:
            self._local.move_to_end(key)
        return val

    def set(self, key: str, value: bytes, ttl: int = _DEFAULT_TTL) -> None:
        if self._redis is not None:
            try:
                self._redis.set(key, value, ex=ttl)
                return
            except Exception:
                pass
        self._local[key] = value
        self._local.move_to_end(key)
        while len(self._local) > _MAX_LOCAL:
            self._local.popitem(last=False)  # evict oldest


# Module-level singleton shared by search.py.
cache = Cache()
