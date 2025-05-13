from core.config import settings

# Пример использования загруженных настроек
print(settings.db.url)  # Должно вывести строку подключения к базе данных из .env
print(settings.gunicorn.workers)  # Должно вывести количество воркеров для Gunicorn из .env
