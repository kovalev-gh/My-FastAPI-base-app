import asyncio
import json
import time
from typing import Awaitable, Callable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.cache.keys import lock_key, product_card, product_price, product_ver
from core.cache.redis_client import get_redis
from core.cache.serializers import (
    serialize_product_base,
    serialize_product_dynamic,
)
from core.config import settings
from core.models.product import Product
from core.models.product_attribute import ProductAttributeValue


# =========================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =========================

def _now() -> int:
    return int(time.time())


def _dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def _loads(s: str | None):
    return json.loads(s) if s else None


async def _get_version(product_id: int) -> int:
    r = get_redis()
    ver = await r.get(product_ver(product_id))
    return int(ver) if ver else 1


async def bump_product_version(product_id: int) -> int:
    """
    Вызвать при изменении стабильной части товара:
    название/описание/фото/атрибуты/категория и т.п.
    """
    r = get_redis()
    ver = await r.incr(product_ver(product_id))
    return int(ver)


# =========================
# ЧТЕНИЕ ИЗ БД
# =========================

async def _load_product_base_from_db(product_id: int, session: AsyncSession) -> Product | None:
    stmt = (
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute),
            selectinload(Product.category),
        )
        .where(Product.id == product_id, Product.is_deleted == False, Product.is_active == True)  # noqa: E712
    )
    res = await session.execute(stmt)
    return res.scalars().first()


async def _load_product_dynamic_from_db(product_id: int, session: AsyncSession) -> Product | None:
    stmt = (
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.id == product_id)
    )
    res = await session.execute(stmt)
    return res.scalars().first()


# ======================================================================
#  READ-ASIDE кэш с "race window"
# ======================================================================

async def _store_set(key: str, data: dict | object, ttl: int, race: int) -> None:
    """
    Кладём значение с «окном гонки». Если пришла Pydantic-модель,
    конвертируем её в dict через .model_dump().
    """
    if hasattr(data, "model_dump"):
        data = data.model_dump(mode="json", exclude_none=True)

    r = get_redis()
    now = _now()
    payload = {
        "data": data,
        "stale_at": now + ttl,
        "expire_at": now + ttl + race,
    }
    await r.set(key, _dumps(payload), ex=max(1, ttl + race))


async def _store_get(key: str, race: int) -> tuple[dict | None, int | None, int | None]:
    r = get_redis()
    raw = await r.get(key)
    if not raw:
        return None, None, None

    obj = _loads(raw)
    data = obj.get("data")
    stale_at = obj.get("stale_at")
    expire_at = obj.get("expire_at")

    if stale_at is None or expire_at is None:
        pttl = await r.pttl(key)  # мс
        if pttl is None or pttl < 0:
            return data, None, None
        now = _now()
        expire_at = now + int(pttl / 1000)
        stale_at = max(now, expire_at - max(1, race))

    return data, int(stale_at), int(expire_at)


async def _try_lock(lkey: str, lock_ttl: int) -> bool:
    r = get_redis()
    return bool(await r.set(lkey, "1", ex=max(1, lock_ttl), nx=True))


async def _unlock(lkey: str) -> None:
    r = get_redis()
    await r.delete(lkey)


async def _read_aside_cached(
    *,
    key: str,
    ttl: int,
    race: int,
    lock_ttl: int,
    loader: Callable[[], Awaitable[dict | object | None]],
) -> dict | None:
    """
    Реализация схемы read-aside cache с race window.
    """
    data, stale_at, expire_at = await _store_get(key, race=race)
    now = _now()

    if data is not None and stale_at is not None and expire_at is not None:
        if now <= stale_at:
            return data
        if now <= expire_at:
            lkey = lock_key(key)
            if await _try_lock(lkey, lock_ttl):
                try:
                    fresh = await loader()
                    if fresh is not None:
                        if hasattr(fresh, "model_dump"):
                            fresh = fresh.model_dump(mode="json", exclude_none=True)
                        await _store_set(key, fresh, ttl, race)
                        return fresh
                    return data
                finally:
                    await _unlock(lkey)
            return data

    # Кэша нет или полностью протух
    lkey = lock_key(key)
    if await _try_lock(lkey, lock_ttl):
        try:
            fresh = await loader()
            if fresh is None:
                return None
            if hasattr(fresh, "model_dump"):
                fresh = fresh.model_dump(mode="json", exclude_none=True)
            await _store_set(key, fresh, ttl, race)
            return fresh
        finally:
            await _unlock(lkey)

    await asyncio.sleep(0.05)
    data2, _, _ = await _store_get(key, race=race)
    return data2


# =========================
# ПАРАМЕТРЫ ДЛЯ ТОВАРА
# =========================

PRODUCT_TTL = settings.redis.product_ttl
PRODUCT_RACE = max(1, min(300, PRODUCT_TTL // 2))       # до 5 минут race-окно

PRICE_TTL = settings.redis.price_ttl
PRICE_RACE = max(1, min(10, max(1, PRICE_TTL // 2)))    # до 10 сек race-окно

LOCK_TTL = settings.redis.lock_ttl


# =========================
# ПУБЛИЧНЫЕ ФУНКЦИИ
# =========================

async def get_product_base(product_id: int, session: AsyncSession) -> dict | None:
    ver = await _get_version(product_id)
    key = product_card(product_id, ver)

    async def _loader():
        p = await _load_product_base_from_db(product_id, session)
        if not p:
            return None
        return serialize_product_base(p)

    return await _read_aside_cached(
        key=key,
        ttl=PRODUCT_TTL,
        race=PRODUCT_RACE,
        lock_ttl=LOCK_TTL,
        loader=_loader,
    )


async def get_product_dynamic(product_id: int, session: AsyncSession) -> dict | None:
    key = product_price(product_id)

    async def _loader():
        p = await _load_product_dynamic_from_db(product_id, session)
        if not p:
            return None
        return serialize_product_dynamic(p)

    return await _read_aside_cached(
        key=key,
        ttl=PRICE_TTL,
        race=PRICE_RACE,
        lock_ttl=LOCK_TTL,
        loader=_loader,
    )


async def assemble_product(product_id: int, session: AsyncSession) -> dict | None:
    base = await get_product_base(product_id, session)
    if not base:
        return None

    dyn = await get_product_dynamic(product_id, session)
    if dyn:
        base.update(dyn)
    return base


async def invalidate_dynamic(product_id: int):
    r = get_redis()
    await r.delete(product_price(product_id))
