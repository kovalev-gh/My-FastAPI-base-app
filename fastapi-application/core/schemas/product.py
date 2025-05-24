#вроде все

from pydantic import BaseModel
from pydantic import ConfigDict


class ProductBase(BaseModel):
    producttitle: str


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int