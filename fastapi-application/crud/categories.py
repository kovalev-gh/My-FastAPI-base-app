
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.category import Category

async def get_all_categories(session: AsyncSession):
    result = await session.execute(select(Category).order_by(Category.name))
    return result.scalars().all()

async def create_category(session: AsyncSession, name: str):
    new_category = Category(name=name)
    session.add(new_category)
    await session.commit()
    await session.refresh(new_category)
    return new_category
