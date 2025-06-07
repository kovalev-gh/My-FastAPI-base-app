from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper
from core.models.user import User
from core.schemas.category import CategoryCreate, CategoryRead
from crud.categories import get_all_categories, create_category
from api.api_v1.deps import get_current_superuser

router = APIRouter(tags=["Category"])


@router.get("/", response_model=List[CategoryRead], summary="Получить список категорий")
async def list_categories(
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await get_all_categories(session)


@router.post("/", response_model=CategoryRead, summary="Создать категорию (только суперпользователь)")
async def create_category_endpoint(
    category: CategoryCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    current_superuser: User = Depends(get_current_superuser),
):
    existing = await get_all_categories(session)
    if any(c.name.lower() == category.name.lower() for c in existing):
        raise HTTPException(status_code=400, detail="Такая категория уже существует")
    return await create_category(session, name=category.name)
