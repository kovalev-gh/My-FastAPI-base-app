from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from .base import Base
from .mixins.int_id_pk import IntIdPkMixin

class User(IntIdPkMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    email_: Mapped[str] = mapped_column("email", String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    orders: Mapped[list["Order"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def email(self) -> str:
        # Например, возвращаем сохранённый email (или подставной, если поле пустое)
        return self.email_ or f"{self.username}@domain.com"
