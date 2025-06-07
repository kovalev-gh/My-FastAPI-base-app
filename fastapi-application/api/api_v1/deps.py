from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from core.models.user import User
from crud.users import get_user_by_username
from core.config import settings  # ✅ Получаем секрет из настроек

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


# 📦 Получение сессии
async def get_db() -> AsyncSession:
    async for session in db_helper.session_getter():
        yield session


# 🔐 Обязательный пользователь (авторизация обязательна)
async def get_current_user_required(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Вы не авторизованы",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, settings.security.secret_key, algorithms=["HS256"])
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен")

    user = await get_user_by_username(db, username=username)
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return user


# 👑 Только суперпользователь
async def get_current_superuser(
    current_user: User = Depends(get_current_user_required),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения действия",
        )
    return current_user


# 🟡 Опциональный пользователь (может быть None)
async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, settings.security.secret_key, algorithms=["HS256"])
        username: str | None = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None

    return await get_user_by_username(db, username=username)
