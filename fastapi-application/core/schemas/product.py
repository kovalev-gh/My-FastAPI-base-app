from pydantic import BaseModel
from pydantic import ConfigDict


class ProductBase(BaseModel):
    title: str
    description: str



class ProductCreate(ProductBase):

    retail_price: str
    opt_price: str
    quantity: str
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int