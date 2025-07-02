from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
import logging

from core.models.order import Order, OrderStatus
from core.models.order_item import OrderItem
from core.models.cart import CartItem
from core.models.product import Product
from mailing.send_order_notification import send_order_notification_email

logger = logging.getLogger(__name__)


async def create_order_from_cart(user_id: int, db: AsyncSession) -> Order:
    try:
        result = await db.execute(select(CartItem).where(CartItem.user_id == user_id))
        cart_items = result.scalars().all()

        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        order = Order(
            user_id=user_id,
            status=OrderStatus.PENDING,
            created_at=datetime.utcnow()
        )
        db.add(order)
        await db.flush()  # Получаем order.id

        added_items = 0
        for item in cart_items:
            # Проверка: существует ли продукт
            product = await db.get(Product, item.product_id)
            if not product:
                logger.warning(f"🛑 Skipping non-existent product_id={item.product_id}")
                continue

            db.add(OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity
            ))
            added_items += 1

        if added_items == 0:
            raise HTTPException(status_code=400, detail="No valid products in cart")

        # Очищаем корзину
        await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
        await db.commit()

        # Глубокая подгрузка
        result = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.attributes)
            )
            .where(Order.id == order.id)
        )
        order = result.scalar_one()

        if not order.items:
            raise HTTPException(status_code=500, detail="Order has no items after commit")

        try:
            await send_order_notification_email(order)
        except Exception as e:
            logger.warning(f"⚠️ Failed to send order email: {e}")

        return order

    except HTTPException:
        raise  # пробрасываем дальше
    except Exception as e:
        logger.exception("❌ Unexpected error in create_order_from_cart")
        raise HTTPException(status_code=500, detail="Internal server error")


async def get_orders_by_user_id(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items)
            .selectinload(OrderItem.product)
            .selectinload(Product.attributes)
        )
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


async def get_all_orders(session: AsyncSession) -> list[Order]:
    result = await session.execute(
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items)
            .selectinload(OrderItem.product)
            .selectinload(Product.attributes)
        )
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()
