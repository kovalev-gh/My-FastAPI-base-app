from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from core.schemas.user import Token
from crud.users import get_user_by_username
from core.security import verify_password, create_access_token, create_refresh_token
from core.config import settings
from api.api_v1.deps import get_db
from datetime import timedelta

router = APIRouter()

@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token_data = {"sub": user.username}
    access_token = create_access_token(
        token_data,
        expires_delta=timedelta(minutes=settings.security.access_token_expire_minutes)
    )
    refresh_token = create_refresh_token(
        token_data,
        expires_delta=timedelta(days=settings.security.refresh_token_expire_days)
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
