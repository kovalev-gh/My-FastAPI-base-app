from pydantic import BaseModel, ConfigDict
from typing import Optional, List


# ---------- Атрибуты продукта ----------

class ProductAttributeInput(BaseModel):
    attribute_id: int
    value: str


class ProductAttributeRead(BaseModel):
    id: int
    attribute_id: int
    value: str
    name: str  # имя характеристики (join с Definition)
    unit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


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
    attributes: Optional[List[ProductAttributeInput]] = []  # 🟢 Сделали необязательным


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
    attributes: List[ProductAttributeRead] = []  # 🟢 Безопасное значение по умолчанию

    model_config = ConfigDict(from_attributes=True)


class ProductReadUser(ProductReadBase):
    pass


class ProductReadSuperuser(ProductReadBase):
    opt_price: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
