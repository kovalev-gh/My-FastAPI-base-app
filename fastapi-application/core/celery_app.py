from celery import Celery
from core.config import settings

# Создаём экземпляр Celery
celery_app = Celery(
    "worker",
    broker=settings.celery_broker_url,        # ✅ автоматически выбирает local/docker
    backend=settings.celery.result_backend,   # ✅ backend для результатов
    include=["tasks.reports"],                # ✅ регистрируем модуль с тасками
)

# Роутинг задач по очередям
celery_app.conf.task_routes = {
    "tasks.reports.*": {"queue": "reports"},
}
