from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.ext.asyncio import AsyncSession

from crud.products import (
    get_product_by_id,
    get_all_products,
    create_product,
)
from core.models import db_helper
from core.models.user import User
from api.api_v1.deps import get_current_user_optional, get_current_superuser
from core.schemas.product import (
    ProductCreate,
    ProductReadUser,
    ProductReadSuperuser,
)

router = APIRouter(tags=["Product"])


@router.get("", summary="Список продуктов (для всех пользователей)")
async def get_products(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    products = await get_all_products(session=session)

    if current_user and current_user.is_superuser:
        return [ProductReadSuperuser.model_validate(p) for p in products]
    else:
        return [ProductReadUser.model_validate(p) for p in products]


@router.post("", response_model=ProductReadSuperuser, summary="Создание продукта (только для суперпользователя)")
async def create_product_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    product_create: ProductCreate,
):
    product = await create_product(
        session=session,
        product_create=product_create,
    )
    return ProductReadSuperuser.model_validate(product)


@router.get("/{product_id}", summary="Получить продукт по ID")
async def read_product(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    product = await get_product_by_id(session=session, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user and current_user.is_superuser:
        return ProductReadSuperuser.model_validate(product)
    return ProductReadUser.model_validate(product)
