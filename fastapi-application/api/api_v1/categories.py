from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from core.models.user import User
from core.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate, CategoryWithAttributes
from crud.categories import (
    get_all_categories,
    create_category,
    update_category,
    soft_delete_category,
    restore_category,
    get_categories_with_attributes,
    get_category_with_attributes  # добавлен импорт новой функции
)
from api.api_v1.deps import get_current_superuser

router = APIRouter(prefix="/categories", tags=["Category"])


@router.get("/", response_model=List[CategoryRead], summary="Получить список категорий")
async def list_categories(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_all_categories(session)


@router.post("/", response_model=CategoryRead, summary="Создать категорию (только суперпользователь)")
async def create_category_endpoint(
    category: CategoryCreate,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    existing = await get_all_categories(session)
    if any(c.name.lower() == category.name.lower() for c in existing):
        raise HTTPException(status_code=400, detail="Такая категория уже существует")
    return await create_category(session, name=category.name)


@router.patch("/restore", response_model=CategoryRead, summary="Восстановить удалённую категорию (по имени)")
async def restore_category_endpoint(
    name: Annotated[str, Query()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    return await restore_category(session, name=name)


@router.patch("/{category_id}", response_model=CategoryRead, summary="Обновить категорию по ID")
async def patch_category(
    category_id: int,
    data: CategoryUpdate,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    return await update_category(session, category_id, data.name)


@router.delete("/{category_id}", summary="Мягкое удаление категории (только суперпользователь)")
async def delete_category(
    category_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    success = await soft_delete_category(session, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return {"message": "Категория помечена как удалённая"}


@router.get("/with-attributes", summary="Категории с привязанными атрибутами", response_model=List[CategoryWithAttributes])
async def list_categories_with_attributes(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_categories_with_attributes(session)


# Новый эндпоинт — получить категорию по ID с атрибутами
@router.get("/{category_id}/with-attributes", summary="Категория с атрибутами по ID", response_model=CategoryWithAttributes)
async def get_category_with_attributes_endpoint(
    category_id: Annotated[int, Path()],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    category = await get_category_with_attributes(session, category_id)
    return category
