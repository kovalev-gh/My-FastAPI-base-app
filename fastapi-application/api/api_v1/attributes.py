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
from core.models.product import Product  # для проверки полей модели
from core.schemas.attribute import (
    AttributeCreate,
    AttributeOutPublic,
    AttributeOutAdmin,
)
from crud.attributes import (
    get_all_attributes,
    create_attribute,
    get_attributes_by_category,
    link_attribute_to_category,
    unlink_attribute_from_category
)

router = APIRouter(tags=["Attribute"])

META_PREFIX = "meta_"


def get_reserved_product_fields() -> set[str]:
    return set(Product.__table__.columns.keys())


# ---------- Список всех атрибутов ----------

@router.get(
    "",
    summary="Список всех атрибутов (автоопределение роли)",
    response_model=List[AttributeOutPublic]
)
async def list_all_attributes(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    attributes = await get_all_attributes(session)

    # Если админ — вернуть полную схему с meta_
    if current_user and current_user.is_superuser:
        # FastAPI обходит типизацию, нужно вернуть вручную
        from fastapi.responses import JSONResponse
        from pydantic import TypeAdapter
        serialized = TypeAdapter(List[AttributeOutAdmin]).dump_python(attributes)
        return JSONResponse(content=serialized)

    return attributes  # обычный список с AttributeOutPublic (автоматическое удаление meta_)


# ---------- Создание атрибута ----------

@router.post(
    "",
    summary="Создать атрибут",
    response_model=AttributeOutAdmin  # Всегда возвращаем как есть (с meta_) для контроля
)
async def create_attribute_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    data: Annotated[AttributeCreate, Body()],
):
    name = data.name

    # Автоматически добавим префикс, если его нет
    if not name.startswith(META_PREFIX):
        name = f"{META_PREFIX}{name}"

    # Проверка на конфликт с полями модели Product
    raw_key = name.removeprefix(META_PREFIX)
    if raw_key in get_reserved_product_fields():
        raise HTTPException(
            status_code=400,
            detail=f"Атрибут '{raw_key}' конфликтует с системным полем модели Product"
        )

    return await create_attribute(session, name=name, unit=data.unit)


# ---------- Атрибуты категории ----------

@router.get(
    "/category/{category_id}",
    summary="Атрибуты категории (всегда без meta_)",
    response_model=List[AttributeOutPublic]
)
async def get_attributes_for_category(
    category_id: Annotated[int, Path()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_attributes_by_category(session, category_id)


# ---------- Привязка и отвязка ----------

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
