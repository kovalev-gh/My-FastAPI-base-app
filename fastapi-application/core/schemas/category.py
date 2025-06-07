
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str

class CategoryRead(CategoryBase):
    id: int
    is_deleted: bool

    class Config:
        from_attributes = True
