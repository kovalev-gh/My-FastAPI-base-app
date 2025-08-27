# core/search/indexer.py
from typing import Any
from elasticsearch import AsyncElasticsearch
from core.models.product import Product
from .es import index_alias

def _category_name(p: Product) -> str | None:
    cat = getattr(p, "category", None)
    return getattr(cat, "name", None) if cat is not None else None

def _to_doc(p: Product) -> dict[str, Any]:
    return {
        "title":        getattr(p, "title", None),
        "description":  getattr(p, "description", None),
        "category_id":  getattr(p, "category_id", None),
        "category_name": _category_name(p),
    }

async def index_product(es: AsyncElasticsearch, p: Product):
    # если применяешь soft-delete — просто не индексируй удалённые: удаляй документ из ES в CRUD на delete
    await es.index(index=index_alias(), id=str(p.id), document=_to_doc(p), refresh="false")

async def delete_product(es: AsyncElasticsearch, product_id: int):
    try:
        await es.delete(index=index_alias(), id=str(product_id), refresh="false")
    except Exception:
        pass
