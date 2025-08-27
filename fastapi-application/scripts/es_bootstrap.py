# scripts/es_bootstrap.py
import asyncio
from elasticsearch import AsyncElasticsearch

# Настройки подключения и имен
ES_URL = "http://localhost:9200"
ALIAS = "products"
INDEX = f"{ALIAS}_v1"  # (совмещаем RU + EN)

# Маппинг/настройки: русский + английский анализаторы.
# Сохраняем back-compat: поле title имеет подполе "prefix" (RU-префикс),
# добавляем англ. подполя: "title.en" и "title.prefix_en".
BODY = {
    "settings": {
        "analysis": {
            "filter": {
                # RU
                "ru_stop": {"type": "stop", "stopwords": "_russian_"},
                "ru_stemmer": {"type": "stemmer", "language": "russian"},
                # EN
                "en_stop": {"type": "stop", "stopwords": "_english_"},
                "en_stemmer": {"type": "stemmer", "language": "english"},
                # Общий edge-ngram для префиксного поиска
                "edge": {"type": "edge_ngram", "min_gram": 2, "max_gram": 15},
            },
            "analyzer": {
                # Базовые анализаторы
                "ru": {"tokenizer": "standard", "filter": ["lowercase", "ru_stop", "ru_stemmer"]},
                "en": {"tokenizer": "standard", "filter": ["lowercase", "en_stop", "en_stemmer"]},
                # Префиксные
                "ru_prefix": {"tokenizer": "standard", "filter": ["lowercase", "ru_stop", "ru_stemmer", "edge"]},
                "en_prefix": {"tokenizer": "standard", "filter": ["lowercase", "en_stop", "en_stemmer", "edge"]},
            },
        }
    },
    "mappings": {
        "properties": {
            # Что ищем (RU + EN + префиксы)
            "title": {
                "type": "text",
                "analyzer": "ru",  # основное поле — русский
                "fields": {
                    "prefix": {"type": "text", "analyzer": "ru_prefix"},     # back-compat для текущего запроса "title.prefix"
                    "en": {"type": "text", "analyzer": "en"},
                    "prefix_en": {"type": "text", "analyzer": "en_prefix"},
                },
            },
            "description": {
                "type": "text",
                "analyzer": "ru",
                "fields": {
                    "en": {"type": "text", "analyzer": "en"},
                },
            },
            "category_name": {
                "type": "text",
                "analyzer": "ru",
                "fields": {
                    "en": {"type": "text", "analyzer": "en"},
                },
            },

            # Фильтры
            "category_id": {"type": "keyword"},
        }
    },
}


async def main():
    es = AsyncElasticsearch(ES_URL, request_timeout=30)
    try:
        # 1) Создаём индекс, если ещё нет
        exists = await es.indices.exists(index=INDEX)
        if not exists:
            await es.indices.create(
                index=INDEX,
                settings=BODY["settings"],
                mappings=BODY["mappings"],
            )
            print(f"Created index {INDEX}")
        else:
            print(f"Index {INDEX} already exists — skip creating")

        # 2) Гарантируем наличие алиаса (идемпотентно)
        alias_exists = await es.indices.exists_alias(name=ALIAS)
        if not alias_exists:
            await es.indices.put_alias(index=INDEX, name=ALIAS)
            print(f"Created alias {ALIAS} -> {INDEX}")
        else:
            # Проверим, куда сейчас указывает алиас
            current = await es.indices.get_alias(name=ALIAS)
            indices_with_alias = list(current.keys())
            if INDEX in indices_with_alias:
                print(f"Alias {ALIAS} already points to {INDEX} — OK")
            else:
                # Не переключаем автоматически, чтобы случайно не задеть продовые данные.
                print(
                    f"Alias {ALIAS} already exists and points to {indices_with_alias}. "
                    f"Not switching automatically. If you want to switch to {INDEX}, run update-aliases:\n"
                    f"  POST /_aliases {{'actions':[{{'remove':{{'index':'{indices_with_alias[0]}','alias':'{ALIAS}'}}}},"
                    f"{{'add':{{'index':'{INDEX}','alias':'{ALIAS}'}}}}]}}"
                )
    finally:
        await es.close()


if __name__ == "__main__":
    asyncio.run(main())
