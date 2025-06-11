from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.category import Category

# crud/categories.py

async def get_all_categories(session: AsyncSession):
    result = await session.execute(
        select(Category).where(Category.is_deleted == False).order_by(Category.name)
    )
    return result.scalars().all()


# crud/categories.py

async def create_category(session: AsyncSession, name: str):
    existing = await session.execute(
        select(Category).where(Category.name == name, Category.is_deleted == False)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Категория с таким именем уже существует")

    new_category = Category(name=name)
    session.add(new_category)
    await session.commit()
    await session.refresh(new_category)
    return new_category


async def restore_category(session: AsyncSession, name: str) -> Category:
    result = await session.execute(
        select(Category).where(Category.name == name)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(404, detail="Категория с таким именем не найдена")

    if not category.is_deleted:
        raise HTTPException(400, detail="Категория уже активна")

    category.is_deleted = False
    await session.commit()
    await session.refresh(category)
    return category


async def update_category(session: AsyncSession, category_id: int, name: str):
    result = await session.execute(select(Category).where(Category.id == category_id, Category.is_deleted == False))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    category.name = name
    await session.commit()
    await session.refresh(category)
    return category


async def soft_delete_category(session: AsyncSession, category_id: int) -> bool:
    result = await session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        return False

    category.is_deleted = True
    await session.commit()
    return True

async def get_categories_with_attributes(session: AsyncSession):
    result = await session.execute(
        select(Category)
        .options(selectinload(Category.attributes))
        .where(Category.is_deleted == False)
        .order_by(Category.name)
    )
    return result.scalars().all()