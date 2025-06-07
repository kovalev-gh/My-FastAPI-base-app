from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    title: str
    description: str | None = None


class ProductBaseExtended(ProductBase):
    retail_price: int | None = None
    opt_price: int | None = None
    quantity: int | None = None
    category_id: int | None = None


class ProductCreate(ProductBaseExtended):
    pass


class ProductUpdate(ProductBaseExtended):
    title: str | None = None  # переопределяем как необязательное
    model_config = ConfigDict(json_schema_extra={"example": {}})


class ProductReadUser(ProductBase):
    id: int
    retail_price: int | None
    quantity: int | None
    category_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductReadSuperuser(ProductReadUser):
    opt_price: int | None = None

    model_config = ConfigDict(from_attributes=True)
