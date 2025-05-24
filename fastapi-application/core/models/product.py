#вроде все

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from .base import Base
from .mixins.int_id_pk import IntIdPkMixin


class Product(IntIdPkMixin, Base):
    producttittle: Mapped[str] = mapped_column(unique=True)
