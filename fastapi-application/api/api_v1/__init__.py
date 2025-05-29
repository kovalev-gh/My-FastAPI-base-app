from fastapi import APIRouter

from core.config import settings

from .auth import router as auth_router

from .users import router as users_router

from .products import router as products_router

from .carts import router as cart_router

router = APIRouter(
    prefix=settings.api.v1.prefix,
)
router.include_router(
    users_router,
    prefix=settings.api.v1.users,
)
router.include_router(
    products_router,
    prefix=settings.api.v1.products,
)
router.include_router(
    auth_router,
    prefix=settings.api.v1.auth,
)


router.include_router(cart_router, prefix="/api/v1")