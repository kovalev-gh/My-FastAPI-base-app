from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Request, Depends
from core.models import db_helper
from crud import users as users_crud
from utils.templates import templates
from core.models.user import User
from api.api_v1.deps import get_current_superuser

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

@router.get("/", name="users:list")
async def users_list(
    request: Request,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    current_superuser: Annotated[User, Depends(get_current_superuser)],  # Добавляем зависимость
):
    users = await users_crud.get_all_users(session=session)
    return templates.TemplateResponse(
        request=request,
        name="users/list.html",
        context={"users": users},
    )