from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.ext.asyncio import AsyncSession

#from tasks import send_welcome_email
from crud.products import get_product_by_id
from core.models import db_helper
from core.models.user import User
from api.api_v1.deps import get_current_superuser
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
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    product_create: ProductCreate,
):
    product = await products_crud.create_product(
        session=session,
        product_create=product_create,
    )
    return product


@router.get("/{product_id}", response_model=ProductRead)
async def read_product(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    product = await products_crud.get_product_by_id(session=session, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product