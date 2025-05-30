from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import JSONResponse
from api.api_v1.deps import get_db, get_current_user
from core.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate
)
from crud.carts import (
    add_to_cart,
    get_cart_by_user,
    remove_from_cart,
    clear_cart,
    update_cart_quantity
)

router = APIRouter( tags=["Cart"])

@router.post("/add", response_model=CartItemResponse)
async def add(
    item: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Добавить товар в корзину или увеличить его количество.
    """
    result = await add_to_cart(db, user.id, item)
    if not result:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    return result

@router.patch("/update", response_model=CartItemResponse)
async def update_quantity(
    item: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Обновить количество конкретного товара в корзине.
    Если quantity <= 0, товар удаляется.
    """
    result = await update_cart_quantity(db, user.id, item.product_id, item.quantity)

    if result is None:
        # Если товар был удалён (или не найден), вернём сообщение явно
        return JSONResponse(
            content={"detail": "Item removed from cart"},
            status_code=status.HTTP_200_OK
        )

    return result

@router.get("/", response_model=list[CartItemResponse])
async def get_cart(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Получить все товары в корзине текущего пользователя.
    """
    return await get_cart_by_user(db, user.id)

@router.delete("/remove/{product_id}")
async def remove_item(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Удалить один товар из корзины по product_id.
    """
    success = await remove_from_cart(db, user.id, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"detail": "Item removed"}

@router.delete("/clear")
async def clear(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Полностью очистить корзину пользователя.
    """
    await clear_cart(db, user.id)
    return {"detail": "Cart cleared"}
