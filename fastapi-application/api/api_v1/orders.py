from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from core.schemas.order import OrderRead
from crud.orders import create_order_from_cart, get_orders_by_user_id
from api.api_v1.deps import get_db, get_current_user
from core.models.user import User

router = APIRouter(tags=["Orders"])


@router.post("/from-cart", response_model=OrderRead)
async def order_from_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        return await create_order_from_cart(db=db, user_id=user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/my", response_model=List[OrderRead])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        return await get_orders_by_user_id(db=db, user_id=user.id)
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")
