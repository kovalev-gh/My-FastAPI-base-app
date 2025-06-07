from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.security import decode_token, create_access_token
from datetime import timedelta
from core.config import settings

router = APIRouter()

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_token(data: RefreshRequest):
    payload = decode_token(data.refresh_token)

    if not payload or payload.get("scope") != "refresh_token":
        raise HTTPException(status_code=403, detail="Invalid or expired refresh token")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=403, detail="Invalid token payload")

    new_access_token = create_access_token(
        {"sub": username},
        expires_delta=timedelta(minutes=settings.security.access_token_expire_minutes)
    )

    return {"access_token": new_access_token, "token_type": "bearer"}
