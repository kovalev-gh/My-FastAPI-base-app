from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Boolean
from core.models.mixins.int_id_pk import IntIdPkMixin
from core.models.base import Base


class ProductImage(IntIdPkMixin, Base):
    __tablename__ = "product_images"

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    image_path: Mapped[str] = mapped_column(String, nullable=False)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)

    # 🔁 Обратная связь с товаром
    product: Mapped["Product"] = relationship(back_populates="images")
