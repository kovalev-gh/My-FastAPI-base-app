from fastapi import APIRouter
from .registration import router as registration_router
from .login import router as login_router
from .me import router as me_router

router = APIRouter(tags=["AUTH"])

router.include_router(registration_router, prefix="")
router.include_router(login_router, prefix="")
router.include_router(me_router, prefix="")