import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from core.celery_app import celery_app
from core.config import settings
from crud.reports import orders_last_hour, top_products


@celery_app.task(name="tasks.reports.generate_reports")
def generate_reports():
    """
    Синхронная обёртка для асинхронной задачи.
    Celery вызывает эту функцию, внутри создаётся event loop.
    """
    return asyncio.run(_generate_reports())


async def _generate_reports():
    """
    Асинхронная логика: создаём новый движок и сессию на каждую таску.
    Это предотвращает конфликт event loop между Celery и asyncpg.
    """
    # 1. создаём движок (async)
    engine = create_async_engine(settings.db.url, echo=settings.db.echo)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    # 2. открываем сессию
    async with Session() as db:
        orders_count = await orders_last_hour(db)   # int
        products = await top_products(db)           # list[Row]

    # 3. закрываем движок
    await engine.dispose()

    # 4. возвращаем JSON-сериализуемый результат
    return {
        "orders_last_hour": orders_count,
        "top_products": [dict(r._mapping) for r in products],
    }
