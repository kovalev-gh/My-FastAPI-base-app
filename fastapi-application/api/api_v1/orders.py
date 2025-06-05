from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional

from core.schemas.order import OrderReadUser, OrderReadSuperuser
from crud.orders import create_order_from_cart, get_orders_by_user_id
from api.api_v1.deps import get_db, get_current_user_required
from core.models.user import User

router = APIRouter(tags=["Orders"])


@router.post("/from-cart", summary="Создать заказ из корзины")
async def order_from_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    try:
        order = await create_order_from_cart(db=db, user_id=user.id)
        if user.is_superuser:
            return OrderReadSuperuser.model_validate(order)
        return OrderReadUser.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/my", summary="Мои заказы")
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    try:
        orders = await get_orders_by_user_id(db=db, user_id=user.id)
        if user.is_superuser:
            return [OrderReadSuperuser.model_validate(o) for o in orders]
        return [OrderReadUser.model_validate(o) for o in orders]
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", summary="Получить заказы (по user_id — только для суперпользователей)")
async def get_orders(
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    if not user.is_superuser and user_id is not None:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    # 🟡 Если суперпользователь и user_id не указан — получаем все заказы
    if user.is_superuser and user_id is None:
        from crud.orders import get_all_orders
        orders = await get_all_orders(db)
    else:
        orders = await get_orders_by_user_id(db=db, user_id=user.id)

    return [OrderReadSuperuser.model_validate(o) for o in orders]