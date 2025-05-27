from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str  # 👈 пароль от пользователя


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str
