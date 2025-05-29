from fastapi import HTTPException
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.cart import CartItem
from core.schemas.cart import CartItemCreate
from core.models.product import Product

async def add_to_cart(db: AsyncSession, user_id: int, item: CartItemCreate):
    # 1. Проверка, существует ли товар
    product_stmt = select(Product).filter_by(id=item.product_id)
    product_result = await db.execute(product_stmt)
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Найти запись в корзине
    cart_stmt = select(CartItem).filter_by(user_id=user_id, product_id=item.product_id)
    cart_result = await db.execute(cart_stmt)
    cart_item = cart_result.scalar_one_or_none()

    if cart_item:
        if item.quantity > 0:
            cart_item.quantity += item.quantity
    else:
        if item.quantity > 0:
            cart_item = CartItem(user_id=user_id, product_id=item.product_id, quantity=item.quantity)
            db.add(cart_item)

    await db.commit()

    if cart_item:
        await db.refresh(cart_item)

    return cart_item


async def get_cart_by_user(db: AsyncSession, user_id: int):
    stmt = select(CartItem).filter_by(user_id=user_id)
    result = await db.execute(stmt)
    return result.scalars().all()


async def remove_from_cart(db: AsyncSession, user_id: int, product_id: int):
    stmt = select(CartItem).filter_by(user_id=user_id, product_id=product_id)
    result = await db.execute(stmt)
    cart_item = result.scalar_one_or_none()

    if cart_item:
        await db.delete(cart_item)
        await db.commit()
        return True
    return False


async def clear_cart(db: AsyncSession, user_id: int):
    stmt = delete(CartItem).filter_by(user_id=user_id)
    await db.execute(stmt)
    await db.commit()


async def update_cart_quantity(db: AsyncSession, user_id: int, product_id: int, new_quantity: int):
    stmt = select(CartItem).filter_by(user_id=user_id, product_id=product_id)
    result = await db.execute(stmt)
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        return None

    if new_quantity <= 0:
        await db.delete(cart_item)
        await db.commit()
        return None

    cart_item.quantity = new_quantity
    await db.commit()
    await db.refresh(cart_item)
    return cart_item
