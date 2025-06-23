from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.models.product_attribute import ProductAttributeDefinition, attribute_category_link, ProductAttributeValue
from core.models.product import Product


# Получить все атрибуты с категориями
async def get_all_attributes(session: AsyncSession):
    result = await session.execute(
        select(ProductAttributeDefinition)
        .options(selectinload(ProductAttributeDefinition.categories))
        .order_by(ProductAttributeDefinition.name)
    )
    return result.scalars().all()


async def get_attribute_by_id(session: AsyncSession, attribute_id: int) -> ProductAttributeDefinition:
    result = await session.execute(
        select(ProductAttributeDefinition)
        .options(selectinload(ProductAttributeDefinition.categories))
        .where(ProductAttributeDefinition.id == attribute_id)
    )
    attribute = result.scalar_one_or_none()
    if not attribute:
        raise HTTPException(status_code=404, detail="ATTRIBUTE_NOT_FOUND")
    return attribute


async def get_attribute_by_name(session: AsyncSession, name: str) -> ProductAttributeDefinition | None:
    result = await session.execute(
        select(ProductAttributeDefinition)
        .options(selectinload(ProductAttributeDefinition.categories))
        .where(ProductAttributeDefinition.name == name)
    )
    return result.scalar_one_or_none()


async def create_attribute(session: AsyncSession, name: str, unit: str | None = None) -> ProductAttributeDefinition:
    existing_attr = await get_attribute_by_name(session, name)
    if existing_attr:
        raise HTTPException(status_code=400, detail="ATTRIBUTE_NAME_CONFLICT")

    new_attr = ProductAttributeDefinition(name=name, unit=unit)
    session.add(new_attr)
    await session.commit()
    await session.refresh(new_attr)
    return new_attr


async def link_attribute_to_category(session: AsyncSession, category_id: int, attribute_id: int):
    result = await session.execute(
        select(attribute_category_link).where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    if result.first():
        raise HTTPException(status_code=400, detail="ATTRIBUTE_ALREADY_LINKED")

    attribute = await session.get(ProductAttributeDefinition, attribute_id)
    if not attribute:
        raise HTTPException(status_code=404, detail="ATTRIBUTE_NOT_FOUND")

    existing_attr_result = await session.execute(
        select(ProductAttributeDefinition)
        .join(attribute_category_link,
              ProductAttributeDefinition.id == attribute_category_link.c.attribute_id)
        .where(
            attribute_category_link.c.category_id == category_id,
            ProductAttributeDefinition.name == attribute.name,
            ProductAttributeDefinition.id != attribute_id
        )
    )
    existing_attr = existing_attr_result.scalar_one_or_none()
    if existing_attr:
        raise HTTPException(
            status_code=400,
            detail=f"Атрибут с именем '{attribute.name.removeprefix('meta_')}' уже существует в этой категории"
        )

    await session.execute(
        attribute_category_link.insert().values(category_id=category_id, attribute_id=attribute_id)
    )
    await session.commit()
    return {"message": "ATTRIBUTE_LINKED_SUCCESSFULLY"}


async def get_attributes_by_category(session: AsyncSession, category_id: int):
    result = await session.execute(
        select(ProductAttributeDefinition)
        .options(selectinload(ProductAttributeDefinition.categories))
        .join(attribute_category_link,
              ProductAttributeDefinition.id == attribute_category_link.c.attribute_id)
        .where(attribute_category_link.c.category_id == category_id)
        .order_by(ProductAttributeDefinition.name)
    )
    return result.scalars().all()


async def unlink_attribute_from_category(session: AsyncSession, category_id: int, attribute_id: int):
    result = await session.execute(
        select(attribute_category_link).where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    if not result.first():
        raise HTTPException(status_code=404, detail="LINK_NOT_FOUND")

    await session.execute(
        attribute_category_link.delete().where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    await session.commit()
    return {"message": "ATTRIBUTE_UNLINKED_SUCCESSFULLY"}
