from pydantic import BaseModel, field_validator, field_serializer
from typing import Optional


META_PREFIX = "meta_"


class AttributeCreate(BaseModel):
    name: str
    unit: Optional[str] = None

    @field_validator("name")
    @classmethod
    def enforce_meta_prefix(cls, name: str) -> str:
        """
        Автоматически добавляет префикс 'meta_', если его нет.
        """
        if not name.startswith(META_PREFIX):
            name = f"{META_PREFIX}{name}"
        return name


class AttributeOutAdmin(BaseModel):
    """
    Схема для админов — показывает имя как есть (с meta_)
    """
    id: int
    name: str
    unit: Optional[str] = None

    class Config:
        from_attributes = True


class AttributeOutPublic(BaseModel):
    """
    Схема для обычных пользователей — убирает префикс meta_
    """
    id: int
    name: str
    unit: Optional[str] = None

    @field_serializer("name")
    def remove_meta_prefix(self, name: str, _info) -> str:
        return name.removeprefix(META_PREFIX)

    class Config:
        from_attributes = True
