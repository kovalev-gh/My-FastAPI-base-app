from typing import Optional
from pydantic import BaseModel, ConfigDict, field_serializer

# ---------- Константа для namespace ----------
META_PREFIX = "meta_"


# ---------- Определение атрибута ----------

class ProductAttributeDefinitionBase(BaseModel):
    name: str
    unit: Optional[str] = None


class ProductAttributeDefinitionCreate(ProductAttributeDefinitionBase):
    pass


class ProductAttributeDefinitionRead(ProductAttributeDefinitionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------- Привязка атрибута к категории ----------

class AttributeCategoryLink(BaseModel):
    attribute_id: int
    category_id: int


# ---------- Значение атрибута для товара ----------

class ProductAttributeValueBase(BaseModel):
    attribute_id: int
    value: str


class ProductAttributeValueCreate(ProductAttributeValueBase):
    product_id: int


class ProductAttributeValueRead(ProductAttributeValueBase):
    id: int
    product_id: int
    name: str                     # Название атрибута
    unit: Optional[str] = None   # Единица измерения

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("name")
    def remove_meta_prefix(self, name: str, _info) -> str:
        return name.removeprefix(META_PREFIX)
