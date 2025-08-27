import os
import logging

import uvicorn
from fastapi.staticfiles import StaticFiles

from core.config import settings
from api import router as api_router
from views import router as views_router
from create_fastapi_app import create_app

# 🔌 ES: корректное закрытие клиента при остановке приложения
from core.search.es import close_client as close_es_client

# Настройка логов
logging.basicConfig(
    level=settings.logging.log_level_value,
    format=settings.logging.log_format,
)

# Создание FastAPI-приложения
main_app = create_app(create_custom_static_urls=True)

# Подключение маршрутов
main_app.include_router(api_router)
main_app.include_router(views_router)

# Подключение медиа-файлов
media_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "media"))
main_app.mount("/media", StaticFiles(directory=media_path), name="media")

# ✅ Закрываем Elasticsearch-клиент на shutdown
@main_app.on_event("shutdown")
async def _shutdown_es_client():
    await close_es_client()

# Запуск приложения
if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=True,
    )
