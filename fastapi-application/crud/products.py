from typing import Sequence, List, Tuple
from fastapi import HTTPException, UploadFile
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from core.models.product import Product, ProductImage
from core.models.product_attribute import ProductAttributeValue, ProductAttributeDefinition
from core.schemas.product import ProductCreate, ProductUpdate
import os, uuid, shutil

# 🔒 Валидация уникальности атрибутов
def validate_unique_attributes(attributes: list[dict | object]):
    seen = set()
    for attr in attributes:
        attr_id = attr["attribute_id"] if isinstance(attr, dict) else attr.attribute_id
        if attr_id in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Атрибут с ID {attr_id} указан более одного раза. Атрибуты должны быть уникальны."
            )
        seen.add(attr_id)

async def get_all_products(session: AsyncSession) -> Sequence[Product]:
    stmt = (
        select(Product)
        .where(Product.is_deleted == False)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute)
        )
        .order_by(Product.id)
    )
    result = await session.scalars(stmt)
    return result.all()

async def get_products_with_pagination(
    session: AsyncSession, limit: int, offset: int
) -> Tuple[List[Product], int]:
    total_result = await session.execute(
        select(func.count()).select_from(Product).where(Product.is_deleted == False)
    )
    total = total_result.scalar_one()

    result = await session.execute(
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute)
        )
        .where(Product.is_deleted == False)
        .order_by(Product.id)
        .offset(offset)
        .limit(limit)
    )
    products = result.scalars().all()
    return products, total

async def get_product_by_id(session: AsyncSession, product_id: int) -> Product | None:
    stmt = (
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute)
        )
        .where(Product.id == product_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def create_product(session: AsyncSession, product_create: ProductCreate) -> Product:
#    result = await session.execute(
#        select(Product).where(Product.sku == product_create.sku)
#    )
#    if result.scalar_one_or_none():
#        raise HTTPException(status_code=400, detail=f"SKU '{product_create.sku}' уже существует")

    # 🔒 Валидация уникальности атрибутов
    validate_unique_attributes(product_create.attributes)

    product_data = product_create.model_dump(exclude={"attributes"})
    product = Product(**product_data)

    # Валидация существующих атрибутов
    attr_ids = [attr.attribute_id for attr in product_create.attributes]
    existing_attr_ids_result = await session.execute(
        select(ProductAttributeDefinition.id).where(ProductAttributeDefinition.id.in_(attr_ids))
    )
    existing_attr_ids = {row[0] for row in existing_attr_ids_result.all()}

    for attr in product_create.attributes:
        if attr.attribute_id not in existing_attr_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Атрибут с id {attr.attribute_id} не существует."
            )

    product.attributes = [
        ProductAttributeValue(attribute_id=attr.attribute_id, value=attr.value)
        for attr in product_create.attributes
    ]

    session.add(product)
    await session.commit()

    # Перезагрузка с атрибутами и их описаниями
    stmt = (
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute)
        )
        .where(Product.id == product.id)
    )
    result = await session.execute(stmt)
    product = result.scalar_one()

    return product

async def update_product(session: AsyncSession, product_id: int, update_data: dict) -> Product:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    #if "sku" in update_data:
    #    existing = await session.execute(
    #        select(Product).where(Product.sku == update_data["sku"], Product.id != product_id)
    #    )
    #    if existing.scalar_one_or_none():
    #        raise HTTPException(status_code=400, detail=f"SKU '{update_data['sku']}' уже существует")

    attributes = update_data.pop("attributes", None)

    for key, value in update_data.items():
        setattr(product, key, value)

    if attributes is not None:
        # 🔒 Валидация уникальности
        validate_unique_attributes(attributes)

        db_attrs_result = await session.execute(
            select(ProductAttributeValue).where(ProductAttributeValue.product_id == product_id)
        )
        db_attrs = {attr.attribute_id: attr for attr in db_attrs_result.scalars()}

        incoming_attrs = {attr["attribute_id"]: attr["value"] for attr in attributes}

        for attr_id, new_value in incoming_attrs.items():
            if attr_id in db_attrs:
                if db_attrs[attr_id].value != new_value:
                    db_attrs[attr_id].value = new_value
            else:
                session.add(ProductAttributeValue(product_id=product_id, attribute_id=attr_id, value=new_value))

        for attr_id in db_attrs:
            if attr_id not in incoming_attrs:
                await session.delete(db_attrs[attr_id])

    await session.commit()
    await session.refresh(product)

    stmt = (
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute)
        )
        .where(Product.id == product_id)
    )
    result = await session.execute(stmt)
    product = result.scalar_one()

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
