from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Table, Column, Integer
from core.models.base import Base


# 🔗 Связующая таблица: атрибуты — категории
attribute_category_link = Table(
    "attribute_category_link",
    Base.metadata,
    Column("attribute_id", ForeignKey("product_attribute_definitions.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class ProductAttributeDefinition(Base):
    __tablename__ = "product_attribute_definitions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)  # Например: "Диагональ"
    unit: Mapped[str | None] = mapped_column(String, nullable=True)  # Например: "дюймы"

    # 🔄 связь с категориями (многие ко многим)
    categories: Mapped[list["Category"]] = relationship(
        secondary=attribute_category_link,
        back_populates="attributes"
    )


class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_values"

    id: Mapped[int] = mapped_column(primary_key=True)

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    attribute_id: Mapped[int] = mapped_column(ForeignKey("product_attribute_definitions.id", ondelete="CASCADE"))

    value: Mapped[str] = mapped_column(String, nullable=False)

    # 🔁 связь с товаром и определением
    product: Mapped["Product"] = relationship(back_populates="attributes")
    attribute: Mapped["ProductAttributeDefinition"] = relationship()
