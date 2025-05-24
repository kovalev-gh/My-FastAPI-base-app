from typing import Annotated

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Request, Depends

from core.models import db_helper
from crud import products as products_crud
from utils.templates import templates


router = APIRouter(
    prefix="/products",
    tags=["Product"],
)


@router.get("/", name="products:list")
async def products_list(
    request: Request,
    session: Annotated[
        AsyncSession,
        Depends(db_helper.session_getter),
    ],
):
    products = await products_crud.get_all_products(session=session)

    return templates.TemplateResponse(
        request=request,
        name="products/list.html",
        context={"products": products},
    )