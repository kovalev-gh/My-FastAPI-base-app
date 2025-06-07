from typing import Sequence, List, Tuple
from fastapi import HTTPException, UploadFile
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.product import Product, ProductImage
from core.schemas.product import ProductCreate, ProductUpdate
import os, uuid, shutil


async def get_all_products(session: AsyncSession) -> Sequence[Product]:
    stmt = select(Product).where(Product.is_deleted == False).order_by(Product.id)
    result = await session.scalars(stmt)
    return result.all()


async def get_products_with_pagination(
    session: AsyncSession, limit: int, offset: int
) -> Tuple[List[Product], int]:
    total_result = await session.execute(select(func.count()).select_from(Product).where(Product.is_deleted == False))
    total = total_result.scalar_one()

    result = await session.execute(
        select(Product)
        .where(Product.is_deleted == False)
        .order_by(Product.id)
        .offset(offset)
        .limit(limit)
    )
    products = result.scalars().all()
    return products, total


async def get_product_by_id(session: AsyncSession, product_id: int) -> Product | None:
    return await session.get(Product, product_id)


async def create_product(session: AsyncSession, product_create: ProductCreate) -> Product:
    result = await session.execute(
        select(Product).where(Product.title == product_create.title)
    )
    existing_product = result.scalar_one_or_none()
    if existing_product:
        raise HTTPException(
            status_code=400,
            detail=f"Продукт с названием '{product_create.title}' уже существует.",
        )

    product = Product(**product_create.model_dump())
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def update_product(session: AsyncSession, product_id: int, update_data: dict) -> Product:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    if "title" in update_data:
        existing = await session.execute(
            select(Product).where(Product.title == update_data["title"], Product.id != product_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Продукт с названием '{update_data['title']}' уже существует.")

    for key, value in update_data.items():
        setattr(product, key, value)

    await session.commit()
    await session.refresh(product)
    return product


async def delete_product(session: AsyncSession, product_id: int) -> bool:
    product = await session.get(Product, product_id)
    if not product:
        return False

    product.is_deleted = True
    await session.commit()
    return True


async def add_product_image(session: AsyncSession, product_id: int, image_path: str) -> ProductImage:
    image = ProductImage(product_id=product_id, image_path=image_path)
    session.add(image)
    await session.commit()
    await session.refresh(image)
    return image


async def save_uploaded_image_to_product(
    session: AsyncSession,
    product_id: int,
    file: UploadFile,
    subfolder: str,
    base_dir: str = "media/products"
) -> ProductImage:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    safe_subfolder = os.path.normpath(subfolder).replace("..", "").strip("/\\")
    upload_dir = os.path.join(base_dir, safe_subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return await add_product_image(session, product_id, file_path)


async def delete_product_image(session: AsyncSession, image_id: int) -> bool:
    result = await session.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        return False

    if os.path.exists(image.image_path):
        os.remove(image.image_path)

    await session.delete(image)
    await session.commit()
    return True


async def set_main_product_image(session: AsyncSession, image_id: int) -> bool:
    result = await session.execute(select(ProductImage).where(ProductImage.id == image_id))
    target = result.scalar_one_or_none()
    if not target:
        return False

    await session.execute(
        update(ProductImage)
        .where(ProductImage.product_id == target.product_id)
        .values(is_main=False)
    )
    await session.execute(
        update(ProductImage)
        .where(ProductImage.id == image_id)
        .values(is_main=True)
    )
    await session.commit()
    return True


async def get_product_images(session: AsyncSession, product_id: int) -> List[ProductImage]:
    result = await session.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    return result.scalars().all()
