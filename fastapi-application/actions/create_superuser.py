from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
import sys
from os import getenv

# Добавляем корень проекта в sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper, User
from core.schemas.user import UserCreate
from crud import users as users_crud
from core.security import hash_password

# Значения по умолчанию из переменных окружения или фиксированные
DEFAULT_EMAIL = getenv("DEFAULT_EMAIL", "admin@example.com")
DEFAULT_USERNAME = getenv("DEFAULT_USERNAME", "admin")
DEFAULT_PASSWORD = getenv("DEFAULT_PASSWORD", "securepassword123")
DEFAULT_PHONE_NUMBER = getenv("DEFAULT_PHONE_NUMBER", "1234567890")
DEFAULT_IS_SUPERUSER = True


async def create_superuser(
        email: str = DEFAULT_EMAIL,
        username: str = 'admin',
        password: str = 'admin',
        phone_number: str = DEFAULT_PHONE_NUMBER,
        is_superuser: bool = DEFAULT_IS_SUPERUSER,
) -> User:
    # Создаем объект UserCreate для передачи в CRUD-функцию
    user_create = UserCreate(
        email=email,
        username=username,
        password=password,
        phone_number=phone_number,
    )

    # Используем сессию для работы с базой данных
    async with db_helper.session_factory() as session:  # type: AsyncSession
        # Проверяем, существует ли пользователь с таким email или username
        existing_user_by_email = await users_crud.get_user_by_email(session=session, email=user_create.email)
        if existing_user_by_email:
            raise ValueError(f"User with email {email} already exists")

        existing_user_by_username = await users_crud.get_user_by_username(session=session,
                                                                          username=user_create.username)
        if existing_user_by_username:
            raise ValueError(f"User with username {username} already exists")

        # Создаем пользователя
        user = await users_crud.create_user(session=session, user_create=user_create)

        # Устанавливаем is_superuser=True
        user.is_superuser = is_superuser
        session.add(user)
        await session.commit()
        await session.refresh(user)

        return user


if __name__ == "__main__":
    try:
        # Запускаем асинхронную функцию
        new_superuser = asyncio.run(create_superuser())
        print(f"Superuser created successfully: {new_superuser.email}, is_superuser: {new_superuser.is_superuser}")
    except Exception as e:
        print(f"Error creating superuser: {str(e)}")