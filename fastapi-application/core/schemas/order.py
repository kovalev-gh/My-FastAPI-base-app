from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from core.schemas.product import ProductRead
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

class OrderItemRead(BaseModel):
    product: ProductRead
    quantity: int

    class Config:
        from_attributes = True

class OrderRead(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    user: UserRead
    items: list[OrderItemRead]

    class Config:
        from_attributes = True
