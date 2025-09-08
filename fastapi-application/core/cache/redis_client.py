# core/cache/redis_client.py
import redis.asyncio as aioredis
from core.config import settings

# глобальный клиент (ленивая инициализация)
_redis: aioredis.Redis | None = None

def init_redis() -> aioredis.Redis:
    """
    Инициализирует подключение к Redis.
    Вызывать при старте приложения (например, в main.py).
    """
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.CACHE_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis

def get_redis() -> aioredis.Redis:
    """
    Возвращает экземпляр клиента Redis.
    Если ещё не инициализирован — вызовет init_redis().
    """
    global _redis
    if _redis is None:
        return init_redis()
    return _redis

async def close_redis():
    """Закрывает соединение при завершении приложения."""
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None
