from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from tasks import send_welcome_email
from core.models import db_helper
from core.schemas.user import UserRead, UserCreate
from crud import users as users_crud
from core.models.user import User
from api.api_v1.deps import get_current_superuser, get_current_user_required

router = APIRouter(tags=["Users"])


@router.get("", response_model=list[UserRead])
async def get_users(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    users = await users_crud.get_all_users(session=session)
    return users


@router.post("", response_model=UserRead)
async def create_user(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user_create: UserCreate,
    current_superuser: Annotated[User, Depends(get_current_superuser)],
):
    user = await users_crud.create_user(
        session=session,
        user_create=user_create,
    )
    await send_welcome_email.kiq(user_id=user.id)
    return user


# ✅ Новая ручка: Получить одного пользователя по ID
@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_user: Annotated[User, Depends(get_current_user_required)],
):
    # Только сам пользователь или суперпользователь может смотреть
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    user = await users_crud.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return user
