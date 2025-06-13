from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.product_attribute import ProductAttributeDefinition, attribute_category_link


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
        raise HTTPException(status_code=404, detail="ATTRIBUTE_NOT_FOUND")
    return attribute


# Получить атрибут по имени
async def get_attribute_by_name(session: AsyncSession, name: str) -> ProductAttributeDefinition | None:
    result = await session.execute(
        select(ProductAttributeDefinition).where(ProductAttributeDefinition.name == name)
    )
    return result.scalar_one_or_none()


# Создать новый атрибут с проверкой уникальности имени в базе
async def create_attribute(session: AsyncSession, name: str, unit: str | None = None) -> ProductAttributeDefinition:
    # Проверяем, что атрибут с таким именем уже не существует в базе
    existing_attr = await get_attribute_by_name(session, name)
    if existing_attr:
        raise HTTPException(status_code=400, detail="ATTRIBUTE_NAME_CONFLICT")

    new_attr = ProductAttributeDefinition(name=name, unit=unit)
    session.add(new_attr)
    await session.commit()
    await session.refresh(new_attr)
    return new_attr


# Привязать атрибут к категории с проверкой уникальности имени в категории
async def link_attribute_to_category(session: AsyncSession, category_id: int, attribute_id: int):
    # Проверяем, что атрибут уже не привязан к категории
    result = await session.execute(
        select(attribute_category_link).where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    if result.first():
        raise HTTPException(status_code=400, detail="ATTRIBUTE_ALREADY_LINKED")

    # Получаем атрибут по id
    attribute = await session.get(ProductAttributeDefinition, attribute_id)
    if not attribute:
        raise HTTPException(status_code=404, detail="ATTRIBUTE_NOT_FOUND")

    # Проверяем, есть ли в категории другой атрибут с таким же именем
    existing_attr_result = await session.execute(
        select(ProductAttributeDefinition)
        .join(attribute_category_link,
              ProductAttributeDefinition.id == attribute_category_link.c.attribute_id)
        .where(
            attribute_category_link.c.category_id == category_id,
            ProductAttributeDefinition.name == attribute.name,
            ProductAttributeDefinition.id != attribute_id  # исключаем текущий атрибут
        )
    )
    existing_attr = existing_attr_result.scalar_one_or_none()
    if existing_attr:
        raise HTTPException(
            status_code=400,
            detail=f"Атрибут с именем '{attribute.name.removeprefix('meta_')}' уже существует в этой категории"
        )

    # Добавляем привязку атрибута к категории
    await session.execute(
        attribute_category_link.insert().values(category_id=category_id, attribute_id=attribute_id)
    )
    await session.commit()
    return {"message": "ATTRIBUTE_LINKED_SUCCESSFULLY"}


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
        raise HTTPException(status_code=404, detail="LINK_NOT_FOUND")

    await session.execute(
        attribute_category_link.delete().where(
            attribute_category_link.c.category_id == category_id,
            attribute_category_link.c.attribute_id == attribute_id
        )
    )
    await session.commit()
    return {"message": "ATTRIBUTE_UNLINKED_SUCCESSFULLY"}
