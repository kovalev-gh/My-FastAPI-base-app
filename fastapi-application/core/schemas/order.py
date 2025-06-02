from pydantic import BaseModel
from datetime import datetime
from enum import Enum

from core.schemas.product import ProductReadUser, ProductReadSuperuser
from core.schemas.user import UserRead


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class OrderBase(BaseModel):
    address: str | None = None


class OrderCreate(OrderBase):
    pass


class OrderItemReadUser(BaseModel):
    product: ProductReadUser
    quantity: int

    class Config:
        from_attributes = True


class OrderItemReadSuperuser(BaseModel):
    product: ProductReadSuperuser
    quantity: int

    class Config:
        from_attributes = True


class OrderReadUser(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    user: UserRead
    items: list[OrderItemReadUser]

    class Config:
        from_attributes = True


class OrderReadSuperuser(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    user: UserRead
    items: list[OrderItemReadSuperuser]

    class Config:
        from_attributes = True
