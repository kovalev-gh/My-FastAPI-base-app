import os
import logging

import uvicorn
from fastapi.staticfiles import StaticFiles

from core.config import settings
from api import router as api_router
from views import router as views_router
from create_fastapi_app import create_app

# ⚠️ auth_router подключается уже через api_router, так что этот импорт можно удалить:
# from api.api_v1.auth import router as auth_router

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

# Запуск приложения
if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=True,
    )
