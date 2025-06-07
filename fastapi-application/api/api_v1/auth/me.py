from fastapi import APIRouter, Depends
from core.models.user import User
from core.schemas.user import UserRead
from api.api_v1.deps import get_current_user_required

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user_required)):
    return current_user
