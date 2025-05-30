from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from core.models.order import Order, OrderStatus
from core.models.order_item import OrderItem
from core.models.cart import CartItem


async def create_order_from_cart(user_id: int, db: AsyncSession) -> Order:
    result = await db.execute(select(CartItem).where(CartItem.user_id == user_id))
    cart_items = result.scalars().all()

    if not cart_items:
        raise ValueError("Cart is empty")

    order = Order(user_id=user_id, status=OrderStatus.PENDING, created_at=datetime.utcnow())
    db.add(order)
    await db.flush()  # Получаем order.id

    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity
        ))

    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()
    return order
