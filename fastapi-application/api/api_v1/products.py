from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.ext.asyncio import AsyncSession

#from tasks import send_welcome_email
from core.models import db_helper
from core.schemas.product import (
    ProductRead,
    ProductCreate,
)
from crud import products as products_crud

router = APIRouter(tags=["Product"])


@router.get("", response_model=list[ProductRead])
async def get_products(
    # session: AsyncSession = Depends(db_helper.session_getter),
    session: Annotated[
        AsyncSession,
        Depends(db_helper.session_getter),
    ],
):
    products = await products_crud.get_all_products(session=session)
    return products


@router.post("", response_model=ProductRead)
async def create_product(
    session: Annotated[
        AsyncSession,
        Depends(db_helper.session_getter),
    ],
    product_create: ProductCreate,
):
    product = await products_crud.create_product(
        session=session,
        product_create=product_create,
    )
    return product