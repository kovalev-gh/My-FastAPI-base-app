from typing import Annotated
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.deps import get_current_user_optional, get_current_superuser
from core.models import db_helper
from core.models.user import User
from core.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductReadUser,
    ProductReadSuperuser,
)
from crud.products import (
    get_all_products,
    get_products_with_pagination,
    get_product_by_id,
    create_product,
    update_product,
    delete_product,
    save_uploaded_image_to_product,
    delete_product_image,
    set_main_product_image,
    get_product_images,
)

# ▶️ Поиск (ES)
from elasticsearch import AsyncElasticsearch
from core.search.es import get_client, index_alias
from crud.products_search import search_products as search_products_crud
from core.search.indexer import index_product as es_index_product

router = APIRouter(tags=["Product"])


@router.get("", summary="Список продуктов с пагинацией")
async def get_products(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    products, total = await get_products_with_pagination(
        session=session, limit=limit, offset=offset
    )

    is_admin = bool(current_user and current_user.is_superuser)

    return {
        "total": total,
        "items": [
            ProductReadSuperuser.model_validate(p, from_attributes=True)
            if is_admin
            else ProductReadUser.model_validate(p, from_attributes=True)
            for p in products
        ],
    }


@router.get(
    "/search",
    summary="Поиск по товарам (Elasticsearch: title/description/category)",
)
async def search_products_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    es: Annotated[AsyncElasticsearch, Depends(get_client)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    q: str = Query("", description="Строка поиска"),
    category_id: int | None = Query(None, description="Фильтр по категории"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    models, total = await search_products_crud(
        session=session,
        es=es,
        q=q,
        category_id=category_id,
        limit=limit,
        offset=offset,
    )

    is_admin = bool(current_user and current_user.is_superuser)
    items = [
        ProductReadSuperuser.model_validate(p, from_attributes=True)
        if is_admin
        else ProductReadUser.model_validate(p, from_attributes=True)
        for p in models
    ]
    return {"total": total, "items": items}


@router.post(
    "",
    response_model=ProductReadSuperuser,
    summary="Создание продукта (только для суперпользователя)",
)
async def create_product_endpoint(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    product_create: ProductCreate,
    es: Annotated[AsyncElasticsearch, Depends(get_client)],
):
    product = await create_product(
        session=session, product_create=product_create, es=es
    )
    return ProductReadSuperuser.model_validate(product, from_attributes=True)


@router.get("/{product_id}", summary="Получить продукт по ID")
async def read_product(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
):
    product = await get_product_by_id(session=session, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    is_admin = bool(current_user and current_user.is_superuser)

    return (
        ProductReadSuperuser.model_validate(product, from_attributes=True)
        if is_admin
        else ProductReadUser.model_validate(product, from_attributes=True)
    )


@router.patch(
    "/{product_id}",
    response_model=ProductReadSuperuser,
    summary="Обновить продукт по ID",
)
async def update_product_endpoint(
    product_id: int,
    update_data: ProductUpdate,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    es: Annotated[AsyncElasticsearch, Depends(get_client)],
):
    updated_product = await update_product(
        session=session,
        product_id=product_id,
        update_data=update_data.model_dump(exclude_unset=True),
        es=es,
    )
    return ProductReadSuperuser.model_validate(updated_product, from_attributes=True)


@router.delete("/{product_id}", summary="Удалить продукт по ID")
async def delete_product_endpoint(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    es: Annotated[AsyncElasticsearch, Depends(get_client)],
):
    success = await delete_product(session=session, product_id=product_id, es=es)
    if not success:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return {"message": "Продукт удален"}


@router.post("/{product_id}/upload-image", summary="Загрузить изображение в подпапку")
async def upload_product_image(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    product_id: int,
    subfolder: str = Query(
        ..., description="Путь к подпапке, например 'phones/iphone5'"
    ),
    file: UploadFile = File(...),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    image = await save_uploaded_image_to_product(
        session=session,
        product_id=product_id,
        file=file,
        subfolder=subfolder,
    )

    return {
        "message": "Изображение загружено",
        "image_path": image.image_path,
        "product_id": image.product_id,
        "image_id": image.id,
    }


@router.delete("/images/{image_id}", summary="Удалить изображение товара")
async def delete_image(
    image_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    success = await delete_product_image(session, image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Изображение не найдено")
    return {"message": "Изображение удалено"}


@router.post("/images/{image_id}/set-main", summary="Установить изображение как главное")
async def set_main_image(
    image_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    success = await set_main_product_image(session, image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Изображение не найдено")
    return {"message": "Главное изображение установлено"}


@router.get("/{product_id}/images", summary="Получить изображения товара")
async def get_product_images_endpoint(
    product_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    images = await get_product_images(session, product_id)
    return [
        {
            "id": img.id,
            "image_path": img.image_path.lstrip("/"),
            "is_main": img.is_main,
        }
        for img in images
    ]


@router.post(
    "/reindex",
    summary="Переиндексировать все товары (только для суперпользователя)",
)
async def reindex_all_products(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    es: Annotated[AsyncElasticsearch, Depends(get_client)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    products = await get_all_products(session)
    for p in products:
        await es_index_product(es, p)
    await es.indices.refresh(index=index_alias())
    return {"indexed": len(products)}
