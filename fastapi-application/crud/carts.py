from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Literal

from core.models.cart import CartItem
from core.models.product import Product
from core.schemas.cart import CartItemCreate


async def get_cart_item(db: AsyncSession, user_id: int, product_id: int) -> CartItem | None:
    stmt = select(CartItem).filter_by(user_id=user_id, product_id=product_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def set_cart_item(
    db: AsyncSession,
    user_id: int,
    item: CartItemCreate,
    mode: Literal["add", "set"] = "add"
) -> CartItem | None:
    if item.quantity < 0:
        raise HTTPException(status_code=400, detail="Количество не может быть отрицательным")

    # Проверка, существует ли товар
    product = await db.scalar(select(Product).where(Product.id == item.product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    cart_item = await get_cart_item(db, user_id, item.product_id)

    if cart_item:
        if mode == "add":
            cart_item.quantity += item.quantity
        elif mode == "set":
            cart_item.quantity = item.quantity
    else:
        if item.quantity <= 0:
            return None  # не создаём запись с 0
        cart_item = CartItem(
            user_id=user_id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)

    if cart_item.quantity <= 0:
        await db.delete(cart_item)
        await db.commit()
        return None

    await db.commit()

    # 🔁 Повторно загружаем объект с product
    stmt = (
        select(CartItem)
        .options(
            selectinload(CartItem.product).selectinload(Product.attributes)
        )
        .filter_by(id=cart_item.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


async def get_cart_by_user(db: AsyncSession, user_id: int):
    stmt = (
        select(CartItem)
        .options(
            selectinload(CartItem.product).selectinload(Product.attributes)
        )
        .filter_by(user_id=user_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def remove_from_cart(db: AsyncSession, user_id: int, product_id: int) -> bool:
    cart_item = await get_cart_item(db, user_id, product_id)
    if cart_item:
        await db.delete(cart_item)
        await db.commit()
        return True
    return False


async def clear_cart(db: AsyncSession, user_id: int):
    await db.execute(delete(CartItem).filter_by(user_id=user_id))
    await db.commit()
