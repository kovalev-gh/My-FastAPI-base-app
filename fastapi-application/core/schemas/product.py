from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    title: str
    description: str


class ProductCreate(ProductBase):
    retail_price: int | None = None
    opt_price: int | None = None
    quantity: int | None = None


class ProductReadUser(ProductBase):
    id: int
    retail_price: int | None
    quantity: int | None

    model_config = ConfigDict(from_attributes=True)


class ProductReadSuperuser(ProductBase):
    id: int
    retail_price: int | None
    opt_price: int | None
    quantity: int | None

    model_config = ConfigDict(from_attributes=True)
