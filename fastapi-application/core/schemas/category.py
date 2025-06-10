from typing import List
from pydantic import BaseModel
from core.schemas.product_attribute import ProductAttributeDefinitionRead


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int
    is_deleted: bool

    class Config:
        from_attributes = True


class CategoryWithAttributes(CategoryRead):
    attributes: List[ProductAttributeDefinitionRead]

    class Config:
        from_attributes = True
