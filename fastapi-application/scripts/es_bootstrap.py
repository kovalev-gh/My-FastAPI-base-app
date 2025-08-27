# scripts/es_bootstrap.py
import asyncio
from elasticsearch import AsyncElasticsearch

ES_URL = "http://localhost:9200"
ALIAS = "products"
INDEX = f"{ALIAS}_v1"

BODY = {
  "settings": {
    "analysis": {
      "filter": {
        "ru_stop":   {"type": "stop", "stopwords": "_russian_"},
        "ru_stemmer":{"type": "stemmer", "language": "russian"},
        "ru_edge":   {"type": "edge_ngram", "min_gram": 2, "max_gram": 15}
      },
      "analyzer": {
        "ru":       {"tokenizer": "standard", "filter": ["lowercase","ru_stop","ru_stemmer"]},
        "ru_prefix":{"tokenizer": "standard", "filter": ["lowercase","ru_stop","ru_stemmer","ru_edge"]}
      }
    }
  },
  "mappings": {
    "properties": {
      # что ищем
      "title": {
        "type": "text", "analyzer": "ru",
        "fields": {"prefix": {"type": "text", "analyzer": "ru_prefix"}}
      },
      "description": {"type": "text", "analyzer": "ru"},
      "category_name": {"type": "text", "analyzer": "ru"},

      # что фильтруем по желанию
      "category_id": {"type": "keyword"}
    }
  }
}

async def main():
    es = AsyncElasticsearch(ES_URL, request_timeout=10)
    if not await es.indices.exists(index=INDEX):
        await es.indices.create(index=INDEX, settings=BODY["settings"], mappings=BODY["mappings"])
        await es.indices.put_alias(index=INDEX, name=ALIAS)
        print(f"Created {INDEX} + alias {ALIAS}")
    else:
        print(f"Index {INDEX} exists; skip")
    await es.close()

if __name__ == "__main__":
    asyncio.run(main())
