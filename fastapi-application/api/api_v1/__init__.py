from fastapi import APIRouter

from core.config import settings

from .auth import router as auth_router

from .users import router as users_router

from .products import router as products_router

from .carts import router as carts_router

from .orders import router as orders_router

from .categories import router as categories_router

from .attributes import router as attributes_router

from .reports import router as reports_router

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


router.include_router(
    carts_router,
    prefix=settings.api.v1.carts,
)


router.include_router(
    orders_router,
    prefix=settings.api.v1.orders,
)

router.include_router(
    categories_router,
    prefix=settings.api.v1.categories,
)

router.include_router(
    attributes_router,
    prefix=settings.api.v1.attributes,
)

router.include_router(
    reports_router,
    prefix=settings.api.v1.reports,
)