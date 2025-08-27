# crud/products_search.py
from typing import Any, Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from elasticsearch import AsyncElasticsearch

from core.models.product import Product
from core.models.product_attribute import ProductAttributeValue
from core.search.es import index_alias

# Поля, по которым ищем (под v2 маппинг: RU + EN)
SEARCH_FIELDS = [
    "title^3",            # русский анализатор (основное поле)
    "title.prefix^2",     # русские префиксы (edge_ngram)
    "title.en^2",         # английский
    "title.prefix_en^2",  # английские префиксы
    "description",
    "description.en",
    "category_name^0.75",
    "category_name.en^0.6",
]


def _build_es_query(q: str, category_id: Optional[int]) -> dict[str, Any]:
    filters: list[dict[str, Any]] = []
    if category_id is not None:
        # В индексе category_id — keyword, безопаснее приводить к строке
        filters.append({"term": {"category_id": str(category_id)}})

    should: list[dict[str, Any]] = []
    q = (q or "").strip()
    if q:
        should.append({
            "multi_match": {
                "query": q,
                "type": "best_fields",
                "fields": SEARCH_FIELDS,
                "fuzziness": "AUTO",
                "operator": "and",
            }
        })

    return {
        "bool": {
            "filter": filters,
            "should": should,
            "minimum_should_match": 1 if should else 0,
        }
    }


async def search_products(
    session: AsyncSession,
    es: AsyncElasticsearch,
    *,
    q: str = "",
    category_id: Optional[int] = None,
    limit: int = 10,
    offset: int = 0,
) -> Tuple[List[Product], int]:
    """
    Ищем id в Elasticsearch, затем гидрируем полные модели из Postgres
    и возвращаем их в порядке релевантности ES + общее количество совпадений.
    """
    query = _build_es_query(q, category_id)

    res = await es.search(
        index=index_alias(),
        query=query,
        sort=[{"_score": "desc"}],
        from_=offset,
        size=limit,
        track_total_hits=True,
        _source=False,  # берём только _id/_score
    )

    total = int(res["hits"]["total"]["value"])
    ids = [int(h["_id"]) for h in res["hits"]["hits"]]
    if not ids:
        return [], total

    # Жадно подгружаем связи, чтобы избежать lazy-load в async (MissingGreenlet)
    rows = await session.execute(
        select(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttributeValue.attribute),
            selectinload(Product.category),
        )
        .where(Product.id.in_(ids))
    )
    products = rows.scalars().all()

    # Восстанавливаем порядок как в ES (по релевантности)
    by_id = {p.id: p for p in products}
    ordered = [by_id[i] for i in ids if i in by_id]
    return ordered, total
