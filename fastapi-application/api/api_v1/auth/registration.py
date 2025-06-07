from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.schemas.user import UserCreate, UserRead
from crud.users import get_user_by_username, create_user
from api.api_v1.deps import get_db

router = APIRouter()

@router.post("/register", response_model=UserRead)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_username(db, user_create.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    return await create_user(db, user_create)
