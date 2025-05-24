from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .base import Base
from .mixins.int_id_pk import IntIdPkMixin


class Product(IntIdPkMixin, Base):
    title: Mapped[str] = mapped_column(unique=True)
    retail_price: Mapped[str] = mapped_column(nullable=True)
    opt_price: Mapped[str] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(unique=False)
    quantity: Mapped[str] = mapped_column(nullable=True)

