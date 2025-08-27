from typing import Sequence, List, Tuple, Optional
from fastapi import HTTPException, UploadFile
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from core.models.product import Product, ProductImage
from core.models.product_attribute import (
    ProductAttributeValue,
    ProductAttributeDefinition,
)
from core.schemas.product import ProductCreate, ProductUpdate
import os
import uuid
import shutil

from elasticsearch import AsyncElasticsearch
from core.search.indexer import (
    index_product as es_index_product,
    delete_product as es_delete_product,
)

# =========================
# ВСПОМОГАТЕЛЬНЫЕ ХЕЛПЕРЫ
# =========================


def validate_unique_attributes(attributes: list[dict | object]):
    """🔒 Валидация: в списке атрибутов не должно быть дублей по attribute_id."""
    seen = set()
    for attr in attributes or []:
        attr_id = attr["attribute_id"] if isinstance(attr, dict) else attr.attribute_id
        if attr_id in seen:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Атрибут с ID {attr_id} указан более одного раза. "
                    f"Атрибуты должны быть уникальны."
                ),
            )
        seen.add(attr_id)


async def _load_full_product(session: AsyncSession, product_id: int) -> Product | None:
    """
    Загружает продукт с зависимостями:
    - атрибуты (для ответа пользователю),
    - категорию (нужна для индексатора, т.к. поиск только по title/description/category).
    Изображения не подгружаем здесь (у них есть отдельные эндпоинты).
    """
    stmt = (
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(
                ProductAttributeValue.attribute
            ),
            selectinload(Product.category),  # ВАЖНО: жадно грузим категорию
        )
        .where(Product.id == product_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _es_try_index(
    es: Optional[AsyncElasticsearch], product: Optional[Product]
) -> None:
    """Безопасная индексация: опциональный клиент ES, проглатываем сетевые ошибки."""
    if es is None or product is None:
        return
    try:
        await es_index_product(es, product)
    except Exception:
        # Добавьте логирование по месту (sentry/logger)
        pass


async def _es_try_delete(es: Optional[AsyncElasticsearch], product_id: int) -> None:
    if es is None:
        return
    try:
        await es_delete_product(es, product_id)
    except Exception:
        pass


# =========================
# ЧТЕНИЕ
# =========================


async def get_all_products(session: AsyncSession) -> Sequence[Product]:
    stmt = (
        select(Product)
        .where(Product.is_deleted == False)
        .options(
            selectinload(Product.attributes).selectinload(
                ProductAttributeValue.attribute
            ),
            selectinload(Product.category),  # ← добавлено: чтобы не было lazy-load
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
            selectinload(Product.attributes).selectinload(
                ProductAttributeValue.attribute
            ),
            selectinload(Product.category),  # ← добавлено
        )
        .where(Product.is_deleted == False)
        .order_by(Product.id)
        .offset(offset)
        .limit(limit)
    )
    products = result.scalars().all()
    return products, total


async def get_product_by_id(session: AsyncSession, product_id: int) -> Product | None:
    return await _load_full_product(session, product_id)


# =========================
# СОЗДАНИЕ / ОБНОВЛЕНИЕ / УДАЛЕНИЕ (+ индексация)
# =========================


async def create_product(
    session: AsyncSession,
    product_create: ProductCreate,
    es: Optional[AsyncElasticsearch] = None,
) -> Product:
    # 🔒 Валидация уникальности атрибутов
    validate_unique_attributes(product_create.attributes or [])

    product_data = product_create.model_dump(exclude={"attributes"})
    product = Product(**product_data)

    # Валидация, что атрибуты существуют
    attr_ids = [attr.attribute_id for attr in (product_create.attributes or [])]
    if attr_ids:
        existing_attr_ids_result = await session.execute(
            select(ProductAttributeDefinition.id).where(
                ProductAttributeDefinition.id.in_(attr_ids)
            )
        )
        existing_attr_ids = {row[0] for row in existing_attr_ids_result.all()}
        for attr in product_create.attributes or []:
            if attr.attribute_id not in existing_attr_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Атрибут с id {attr.attribute_id} не существует.",
                )

        product.attributes = [
            ProductAttributeValue(attribute_id=attr.attribute_id, value=attr.value)
            for attr in product_create.attributes
        ]

    session.add(product)
    await session.commit()

    # Перезагружаем с зависимостями (для индексации и ответа)
    product = await _load_full_product(session, product.id)

    # Индексация после успешного commit (индексируем только title/description/category)
    await _es_try_index(es, product)

    return product  # type: ignore[return-value]


async def update_product(
    session: AsyncSession,
    product_id: int,
    update_data: dict,
    es: Optional[AsyncElasticsearch] = None,
) -> Product:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    attributes = update_data.pop("attributes", None)

    # Обновляем простые поля
    for key, value in update_data.items():
        setattr(product, key, value)

    # Обновляем атрибуты, если пришли
    if attributes is not None:
        validate_unique_attributes(attributes)

        db_attrs_result = await session.execute(
            select(ProductAttributeValue).where(
                ProductAttributeValue.product_id == product_id
            )
        )
        db_attrs = {attr.attribute_id: attr for attr in db_attrs_result.scalars()}

        incoming_attrs = {attr["attribute_id"]: attr["value"] for attr in attributes}

        # upsert
        for attr_id, new_value in incoming_attrs.items():
            if attr_id in db_attrs:
                if db_attrs[attr_id].value != new_value:
                    db_attrs[attr_id].value = new_value
            else:
                session.add(
                    ProductAttributeValue(
                        product_id=product_id, attribute_id=attr_id, value=new_value
                    )
                )

        # удаление отсутствующих
        for attr_id in list(db_attrs.keys()):
            if attr_id not in incoming_attrs:
                await session.delete(db_attrs[attr_id])

    await session.commit()

    # Перезагрузка с зависимостями (для индексации и ответа)
    product = await _load_full_product(session, product_id)
    if product is None:
        raise HTTPException(
            status_code=404, detail="Продукт не найден после обновления"
        )

    # Индексация (индексируем только title/description/category)
    await _es_try_index(es, product)

    return product


async def delete_product(
    session: AsyncSession,
    product_id: int,
    es: Optional[AsyncElasticsearch] = None,
) -> bool:
    product = await session.get(Product, product_id)
    if not product:
        return False

    # Мягкое удаление в БД
    product.is_deleted = True
    await session.commit()

    # Для поиска — удаляем документ из индекса
    await _es_try_delete(es, product_id)
    return True


# =========================
# ИЗОБРАЖЕНИЯ (без индексации — поиск по ним не строим)
# =========================


async def add_product_image(
    session: AsyncSession, product_id: int, image_path: str
) -> ProductImage:
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
    base_dir: str = "media/products",
) -> ProductImage:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    safe_subfolder = os.path.normpath(subfolder).replace("..", "").strip("/\\")
    upload_dir = os.path.join(base_dir, safe_subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    ext = (file.filename or "file").split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image = await add_product_image(session, product_id, file_path)
    return image


async def delete_product_image(session: AsyncSession, image_id: int) -> bool:
    result = await session.execute(
        select(ProductImage).where(ProductImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        return False

    if os.path.exists(image.image_path):
        try:
            os.remove(image.image_path)
        except Exception:
            # Не блокируем удаление из БД из-за файловой ошибки
            pass

    await session.delete(image)
    await session.commit()
    return True


async def set_main_product_image(session: AsyncSession, image_id: int) -> bool:
    result = await session.execute(
        select(ProductImage).where(ProductImage.id == image_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        return False

    # Снимаем главный со всех картинок продукта
    await session.execute(
        update(ProductImage)
        .where(ProductImage.product_id == target.product_id)
        .values(is_main=False)
    )
    # Ставим выбранную как главную
    await session.execute(
        update(ProductImage).where(ProductImage.id == image_id).values(is_main=True)
    )
    await session.commit()
    return True


async def get_product_images(session: AsyncSession, product_id: int) -> List[ProductImage]:
    result = await session.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    return result.scalars().all()
