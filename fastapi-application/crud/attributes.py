from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.product_attribute import ProductAttributeDefinition, attribute_category_link
from core.models.category import Category


# Получить все атрибуты
async def get_all_attributes(session: AsyncSession):
    result = await session.execute(select(ProductAttributeDefinition).order_by(ProductAttributeDefinition.name))
    return result.scalars().all()


async def get_attribute_by_id(session: AsyncSession, attribute_id: int) -> ProductAttributeDefinition:
    result = await session.execute(
        select(ProductAttributeDefinition).where(ProductAttributeDefinition.id == attribute_id)
    )
    attribute = result.scalar_one_or_none()
    if not attribute:
        raise HTTPException(status_code=404, detail="Атрибут не найден")
    return attribute


# 🔤 Получить атрибут по имени
async def get_attribute_by_name(session: AsyncSession, name: str) -> ProductAttributeDefinition | None:
    result = await session.execute(
        select(ProductAttributeDefinition).where(ProductAttributeDefinition.name == name)
    )
    return result.scalar_one_or_none()


# ➕ Создать новый атрибут (только если не существует с таким именем)
async def create_attribute(session: AsyncSession, name: str, unit: str | None = None) -> ProductAttributeDefinition:
    existing = await get_attribute_by_name(session, name)
    if existing:
        raise HTTPException(status_code=400, detail="Атрибут с таким именем уже существует")

    new_attr = ProductAttributeDefinition(name=name, unit=unit)
    session.add(new_attr)
    await session.commit()
    await session.refresh(new_attr)
    return new_attr


# Привязать атрибут к категории
async def link_attribute_to_category(session: AsyncSession, category_id: int, attribute_id: int):
    # Проверка, существует ли уже связь
    result = await session.execute(
        select(attribute_category_link).where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    if result.first():
        raise HTTPException(status_code=400, detail="Атрибут уже привязан к категории")

    await session.execute(
        attribute_category_link.insert().values(category_id=category_id, attribute_id=attribute_id)
    )
    await session.commit()
    return {"message": "Атрибут привязан к категории"}


# Получить атрибуты категории
async def get_attributes_by_category(session: AsyncSession, category_id: int):
    result = await session.execute(
        select(ProductAttributeDefinition)
        .join(attribute_category_link,
              ProductAttributeDefinition.id == attribute_category_link.c.attribute_id)
        .where(attribute_category_link.c.category_id == category_id)
        .order_by(ProductAttributeDefinition.name)
    )
    return result.scalars().all()


# Удалить привязку атрибута от категории
async def unlink_attribute_from_category(session: AsyncSession, category_id: int, attribute_id: int):
    result = await session.execute(
        select(attribute_category_link).where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    if not result.first():
        raise HTTPException(status_code=404, detail="Связь не найдена")

    await session.execute(
        attribute_category_link.delete().where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    await session.commit()
    return {"message": "Атрибут отвязан от категории"}
