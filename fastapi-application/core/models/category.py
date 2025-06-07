from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin


class Category(IntIdPkMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    products: Mapped[list["Product"]] = relationship(
        back_populates="category",
    )