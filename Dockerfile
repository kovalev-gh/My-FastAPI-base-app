# Базовый образ
FROM python:3.12-slim

# Установим системные пакеты (для работы psycopg2, Pillow и др.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установим Poetry
RUN pip install --no-cache-dir poetry

# Задаём рабочую директорию
WORKDIR /app

# Копируем только файлы зависимостей (для кеша Docker)
COPY pyproject.toml poetry.lock* /app/

# Устанавливаем зависимости (без dev-зависимостей)
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-ansi --without dev

# Копируем весь проект внутрь образа
COPY fastapi-application /app/fastapi-application

# Переменная окружения для корректных импортов
ENV PYTHONPATH=/app/fastapi-application

# Стандартная команда (может переопределяться в docker-compose.yml)
CMD ["celery", "-A", "core.celery_app.celery_app", "worker", "-l", "info", "-Q", "reports"]
