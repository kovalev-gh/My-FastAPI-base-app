from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Text, Integer, String, Boolean
from core.models.mixins.int_id_pk import IntIdPkMixin
from core.models.base import Base

class Product(IntIdPkMixin, Base):

    title: Mapped[str] = mapped_column(unique=True)
    retail_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    opt_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=True)

    # связь с изображениями
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )


class ProductImage(IntIdPkMixin, Base):

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE")
    )
    image_path: Mapped[str] = mapped_column(String, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="images")

    is_main: Mapped[bool] = mapped_column(Boolean, default=False)
