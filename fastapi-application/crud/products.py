from typing import Sequence
from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Product
from core.schemas.product import ProductCreate


async def get_all_products(
    session: AsyncSession,
) -> Sequence[Product]:
    stmt = select(Product).order_by(Product.id)
    result = await session.scalars(stmt)
    return result.all()


async def get_product_by_id(
    session: AsyncSession,
    product_id: int,
) -> Product | None:
    return await session.get(Product, product_id)


async def create_product(
        session: AsyncSession,
        product_create: ProductCreate,
) -> Product:
    # 🔍 Проверка на существующий продукт с таким же title
    result = await session.execute(
        select(Product).where(Product.title == product_create.title)
    )
    existing_product = result.scalar_one_or_none()

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail=f"Продукт с названием '{product_create.title}' уже существует.",
        )

    # ✅ Если такого продукта нет — создаём
    product = Product(**product_create.model_dump())
    session.add(product)
    await session.commit()
    await session.refresh(product)  # рекомендуется, чтобы получить актуальные данные из БД

    return product
