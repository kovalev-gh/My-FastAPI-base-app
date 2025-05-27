from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import User
from core.schemas.user import UserCreate
from core.security import hash_password


async def get_all_users(session: AsyncSession) -> Sequence[User]:
    stmt = select(User).order_by(User.id)
    result = await session.scalars(stmt)
    return result.all()


async def get_user(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    stmt = select(User).where(User.username == username)
    result = await session.scalars(stmt)
    return result.first()


async def create_user(session: AsyncSession, user_create: UserCreate) -> User:
    user = User(
        username=user_create.username,
        hashed_password=hash_password(user_create.password)
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)  # ⬅️ обязательно, чтобы получить .id, .username и т.д.
    return user

