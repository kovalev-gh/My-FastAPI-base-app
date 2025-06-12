from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional, List

# ---------- Константа для namespace ----------
META_PREFIX = "meta_"


# ---------- Атрибуты продукта ----------

class ProductAttributeInput(BaseModel):
    attribute_id: int
    value: str


class ProductAttributeReadBase(BaseModel):
    id: int
    attribute_id: int
    value: str
    name: str
    unit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductAttributeReadUser(ProductAttributeReadBase):
    @field_serializer("name")
    def remove_meta_prefix(self, name: str, _info) -> str:
        return name.removeprefix(META_PREFIX)


class ProductAttributeReadSuperuser(ProductAttributeReadBase):
    pass  # Показывает имя как есть, с meta_


# ---------- Основные модели товара ----------

class ProductBase(BaseModel):
    title: str
    sku: str
    description: Optional[str] = None


class ProductBaseExtended(ProductBase):
    retail_price: Optional[int] = None
    opt_price: Optional[int] = None
    quantity: Optional[int] = None
    category_id: Optional[int] = None


# ---------- Создание и обновление ----------

class ProductCreate(ProductBaseExtended):
    attributes: Optional[List[ProductAttributeInput]] = []


class ProductUpdate(ProductBaseExtended):
    title: Optional[str] = None
    sku: Optional[str] = None
    attributes: Optional[List[ProductAttributeInput]] = None

    model_config = ConfigDict(json_schema_extra={"example": {}})


# ---------- Ответы для пользователей ----------

class ProductReadBase(ProductBase):
    id: int
    retail_price: Optional[int]
    quantity: Optional[int]
    category_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class ProductReadUser(ProductReadBase):
    attributes: List[ProductAttributeReadUser] = []


class ProductReadSuperuser(ProductReadBase):
    opt_price: Optional[int] = None
    attributes: List[ProductAttributeReadSuperuser] = []

    model_config = ConfigDict(from_attributes=True)
