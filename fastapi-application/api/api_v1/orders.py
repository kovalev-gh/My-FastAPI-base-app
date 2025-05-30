from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.schemas.order import OrderRead
from crud.orders import create_order_from_cart
from api.api_v1.deps import get_db, get_current_user
from core.models.user import User
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter(tags=["Orders"])

@router.post("/from-cart", response_model=OrderRead)
def order_from_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        return create_order_from_cart(db=db, user_id=user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")