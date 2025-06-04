from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: str = Field(
        ...,  # или `None` если необязательное
        pattern=r'^\+?\d{10,15}$',
        description="Номер телефона должен содержать от 10 до 15 цифр, может начинаться с +"
    )


class UserCreate(UserBase):
    password: str  # 👈 пароль от пользователя
    email: EmailStr


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_superuser: bool


class Token(BaseModel):
    access_token: str
    token_type: str
