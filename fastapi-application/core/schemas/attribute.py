from pydantic import BaseModel


class AttributeCreate(BaseModel):
    name: str
    unit: str | None = None


class AttributeOut(BaseModel):
    id: int
    name: str
    unit: str | None = None

    class Config:
        from_attributes = True
