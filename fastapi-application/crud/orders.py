from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from core.models.order import Order, OrderStatus
from core.models.order_item import OrderItem
from core.models.cart import CartItem

from mailing.send_order_notification import send_order_notification_email  # 📩 новый импорт


async def create_order_from_cart(user_id: int, db: AsyncSession) -> Order:
    result = await db.execute(select(CartItem).where(CartItem.user_id == user_id))
    cart_items = result.scalars().all()

    if not cart_items:
        raise ValueError("Cart is empty")

    # Создаём заказ
    order = Order(user_id=user_id, status=OrderStatus.PENDING, created_at=datetime.utcnow())
    db.add(order)
    await db.flush()  # Получаем order.id

    # Добавляем элементы заказа
    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity
        ))

    # Очищаем корзину
    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()

    # Загружаем заказ с его items и product
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
        .where(Order.id == order.id)
    )
    order = result.scalar_one()

    # Отправляем email менеджеру
    await send_order_notification_email(order)

    return order


async def get_orders_by_user_id(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.user), selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


async def get_all_orders(session: AsyncSession) -> list[Order]:
    result = await session.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),  # 🟢 подгружаем product внутри items
            selectinload(Order.user),  # 🟢 подгружаем user
        )
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()