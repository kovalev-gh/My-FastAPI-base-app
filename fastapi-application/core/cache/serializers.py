from core.models.product import Product
from core.schemas.cache import ProductBaseCache, ProductDynamicCache

def serialize_product_base(p: Product) -> ProductBaseCache:
    images = sorted(p.images, key=lambda im: (not im.is_main, im.id))
    return ProductBaseCache(
        id=p.id,
        title=p.title,
        description=p.description,
        category_id=p.category_id,
        is_deleted=p.is_deleted,
        is_active=p.is_active,
        images=[im.image_path for im in images],
        attributes=p.serialized_attributes,
    )

def serialize_product_dynamic(p: Product) -> ProductDynamicCache:
    qty = p.quantity or 0
    return ProductDynamicCache(
        retail_price=p.retail_price,
        opt_price=p.opt_price,
        quantity=p.quantity,
        in_stock=qty > 0,
    )
