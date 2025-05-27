# api/api_v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from core.schemas.user import UserCreate, UserRead, Token
from crud.users import get_user_by_username, create_user
from core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from api.api_v1.deps import get_db, get_current_user
from core.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserRead)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_username(db, user_create.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    return await create_user(db, user_create)


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user