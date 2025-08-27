# core/search/es.py
from elasticsearch import AsyncElasticsearch
from typing import Optional
from core.config import settings

_client: Optional[AsyncElasticsearch] = None

def _es_url() -> str:
    # можно вынести в ENV: ELASTICSEARCH_URL=http://localhost:9200
    return getattr(settings, "ELASTICSEARCH_URL", "http://localhost:9200")

def index_alias() -> str:
    return getattr(settings, "ELASTICSEARCH_INDEX_ALIAS", "products")

async def get_client() -> AsyncElasticsearch:
    global _client
    if _client is None:
        _client = AsyncElasticsearch(_es_url(), request_timeout=10)
    return _client

async def close_client():
    global _client
    if _client is not None:
        await _client.close()
        _client = None
