from pydantic import BaseModel
from core.schemas.product import ProductReadUser, ProductReadSuperuser


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int


class CartItemReadUser(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductReadUser  # включает retail_price

    class Config:
        from_attributes = True


class CartItemReadSuperuser(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductReadSuperuser  # включает opt_price и retail_price

    class Config:
        from_attributes = True
