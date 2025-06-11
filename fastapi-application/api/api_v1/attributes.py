from typing import Annotated, List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Path,
    Body
)
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.deps import get_current_superuser, get_current_user_optional
from core.models import db_helper
from core.models.user import User
from core.schemas.attribute import AttributeCreate, AttributeOut
from core.schemas.category import CategoryWithAttributes

from crud.attributes import (
    get_all_attributes,
    get_attribute_by_id,
    get_attribute_by_name,
    create_attribute,
    get_attributes_by_category,
    link_attribute_to_category,
    unlink_attribute_from_category
)

from crud.categories import get_categories_with_attributes

router = APIRouter(prefix="/attributes", tags=["Attribute"])


@router.get("", summary="Список всех атрибутов", response_model=List[AttributeOut])
async def list_all_attributes(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_all_attributes(session)


@router.post("", summary="Создать атрибут", response_model=AttributeOut)
async def create_attribute_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    data: Annotated[AttributeCreate, Body()],
):
    return await create_attribute(session, name=data.name, unit=data.unit)


@router.get("/category/{category_id}", summary="Атрибуты категории", response_model=List[AttributeOut])
async def get_attributes_for_category(
    category_id: Annotated[int, Path()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_attributes_by_category(session, category_id)


@router.post("/category/{category_id}/{attribute_id}", summary="Привязать атрибут к категории")
async def link_attribute_to_category_endpoint(
    category_id: Annotated[int, Path()],
    attribute_id: Annotated[int, Path()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    return await link_attribute_to_category(session, category_id, attribute_id)


@router.delete("/category/{category_id}/{attribute_id}", summary="Отвязать атрибут от категории")
async def unlink_attribute_from_category_endpoint(
    category_id: Annotated[int, Path()],
    attribute_id: Annotated[int, Path()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    return await unlink_attribute_from_category(session, category_id, attribute_id)


