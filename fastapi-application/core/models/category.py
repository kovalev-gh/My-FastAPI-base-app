from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey
from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin
from core.models.product_attribute import attribute_category_link  # ✅ импорт вместо повторного объявления


class Category(IntIdPkMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Связь с товарами
    products: Mapped[list["Product"]] = relationship(
        back_populates="category",
    )

    # Связь с атрибутами (многие ко многим)
    attributes: Mapped[list["ProductAttributeDefinition"]] = relationship(
        secondary=attribute_category_link,
        back_populates="categories",
    )
