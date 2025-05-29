from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from core.models.base import Base  # Убедись, что Base правильно импортируется

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='_user_product_uc'),
    )