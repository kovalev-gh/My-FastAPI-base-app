from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from api.api_v1.deps import get_current_user_required, get_db
from core.models.user import User
from core.schemas.cart import (
    CartItemCreate,
    CartItemReadUser,
    CartItemReadSuperuser,
)
from crud.carts import (
    get_cart_by_user,
    remove_from_cart,
    clear_cart,
    set_cart_item,
)

router = APIRouter(tags=["Cart"])


@router.get("", summary="Получить содержимое корзины")
async def get_my_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    items = await get_cart_by_user(db=db, user_id=user.id)

    if user.is_superuser:
        return [CartItemReadSuperuser.model_validate(i) for i in items]
    return [CartItemReadUser.model_validate(i) for i in items]


@router.post("/add", summary="Добавить товар в корзину")
async def add_to_cart(
    item: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    cart_item = await set_cart_item(db=db, user_id=user.id, item=item, mode="add")
    if cart_item is None:
        raise HTTPException(status_code=400, detail="Невозможно добавить товар с нулевым количеством")

    if user.is_superuser:
        return CartItemReadSuperuser.model_validate(cart_item)
    return CartItemReadUser.model_validate(cart_item)


@router.patch("/update", summary="Обновить количество товара")
async def update_cart_quantity(
    item: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    cart_item = await set_cart_item(db=db, user_id=user.id, item=item, mode="set")
    if cart_item is None:
        raise HTTPException(status_code=400, detail="Товар был удалён из корзины (кол-во = 0)")

    if user.is_superuser:
        return CartItemReadSuperuser.model_validate(cart_item)
    return CartItemReadUser.model_validate(cart_item)


@router.delete("/remove/{product_id}", summary="Удалить товар из корзины")
async def remove_item(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    success = await remove_from_cart(db=db, user_id=user.id, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Товар не найден в корзине")
    return {"detail": "Удалено"}


@router.delete("/clear", summary="Очистить корзину")
async def clear_my_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    await clear_cart(db=db, user_id=user.id)
    return {"detail": "Корзина очищена"}
