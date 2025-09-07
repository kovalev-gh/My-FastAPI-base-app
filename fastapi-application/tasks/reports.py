import asyncio
from core.celery_app import celery_app
from core.models.db_helper import db_helper
from crud.reports import orders_last_hour, top_products

@celery_app.task(name="tasks.reports.generate_reports")
def generate_reports():
    return asyncio.run(_generate_reports())

async def _generate_reports():
    async with db_helper.session_factory() as db:
        return {
            "orders_last_hour": await orders_last_hour(db),
            "top_products": await top_products(db),
        }
