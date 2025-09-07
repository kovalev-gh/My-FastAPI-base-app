from datetime import datetime, timedelta

from sqlalchemy import func, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.order import Order
from core.models.order_item import OrderItem
from core.models.product import Product


async def orders_last_hour(db: AsyncSession) -> int:
    """Сколько заказов было за последний час."""
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    stmt = select(func.count(Order.id)).where(Order.created_at >= one_hour_ago)
    res = await db.execute(stmt)
    # res.scalar() вернёт int | None; нам нужен int
    return int(res.scalar() or 0)


async def top_products(db: AsyncSession, limit: int = 5):
    """Топ товаров по количеству продаж."""
    stmt = (
        select(
            Product.title,
            func.sum(OrderItem.quantity).label("total"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id, Product.title)
        .order_by(desc("total"))
        .limit(limit)
    )
    res = await db.execute(stmt)
    # вернёт список кортежей (title, total)
    return res.all()
