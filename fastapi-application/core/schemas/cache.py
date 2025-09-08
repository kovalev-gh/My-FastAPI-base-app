from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class ProductBaseCache(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    is_deleted: bool
    is_active: bool
    images: List[str] = Field(default_factory=list)
    attributes: Dict[str, str] = Field(default_factory=dict)

    model_config = dict(from_attributes=True)

class ProductDynamicCache(BaseModel):
    retail_price: Optional[int] = None
    opt_price: Optional[int] = None
    quantity: Optional[int] = None
    in_stock: bool
