from typing import Annotated
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.api_v1.deps import get_current_user_optional, get_current_superuser
from core.models.user import User
from core.schemas.product import (
    ProductCreate,
    ProductReadUser,
    ProductReadSuperuser,
)
from core.models.product import Product, ProductImage
from core.models import db_helper
from crud.products import (
    get_product_by_id,
    get_all_products,
    create_product,
)

import os, uuid, shutil

router = APIRouter(tags=["Product"])

BASE_MEDIA_DIR = "media/products"

# 📦 Получение всех продуктов
@router.get("", summary="Список продуктов (для всех пользователей)")
async def get_products(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    products = await get_all_products(session=session)

    if current_user and current_user.is_superuser:
        return [ProductReadSuperuser.model_validate(p) for p in products]
    else:
        return [ProductReadUser.model_validate(p) for p in products]

# ➕ Создание продукта
@router.post("", response_model=ProductReadSuperuser, summary="Создание продукта (только для суперпользователя)")
async def create_product_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    product_create: ProductCreate,
):
    product = await create_product(
        session=session,
        product_create=product_create,
    )
    return ProductReadSuperuser.model_validate(product)

# 🔍 Получение продукта по ID
@router.get("/{product_id}", summary="Получить продукт по ID")
async def read_product(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    product = await get_product_by_id(session=session, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user and current_user.is_superuser:
        return ProductReadSuperuser.model_validate(product)
    return ProductReadUser.model_validate(product)

# 🖼 Загрузка изображения с указанием подпапки
@router.post("/{product_id}/upload-image", summary="Загрузить изображение в подпапку, например phones/iphone5")
async def upload_product_image(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    product_id: int,
    subfolder: str = Query(..., description="Путь к подпапке, например 'phones/iphone5'"),
    file: UploadFile = File(...),

):
    # Проверка типа файла
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    # Проверка существования товара
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Подготовка пути
    safe_subfolder = os.path.normpath(subfolder).replace("..", "").strip("/\\")
    upload_dir = os.path.join(BASE_MEDIA_DIR, safe_subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    # Сохраняем файл с уникальным именем
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Сохраняем в БД
    image = ProductImage(product_id=product_id, image_path=file_path)
    session.add(image)
    await session.commit()
    await session.refresh(image)

    return {
        "message": "Изображение загружено",
        "image_path": f"/{file_path}",
        "product_id": product_id
    }
