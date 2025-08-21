from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, String, Boolean, Text
from core.models.mixins.int_id_pk import IntIdPkMixin
from core.models.base import Base
from core.models.category import Category
from core.models.product_attribute import ProductAttributeValue  # ← для характеристик
from core.models.product_image import ProductImage  # ← если вынесено отдельно

class Product(IntIdPkMixin, Base):
    __tablename__ = "products"

    title: Mapped[str] = mapped_column(String, nullable=False)
    #sku: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    retail_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    opt_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Категория
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    category: Mapped["Category"] = relationship(back_populates="products")

    # Изображения
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )

    # Гибкие характеристики
    attributes: Mapped[list[ProductAttributeValue]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )

    @property
    def serialized_attributes(self) -> dict[str, str]:
        """
        Возвращает атрибуты в виде словаря с удалением префикса 'meta_':
        { "color": "red", "size": "L" }
        """
        return {
            key: value
            for attr in self.attributes
            for key, value in [attr.to_serializable_pair()]
        }
