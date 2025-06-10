"""add product attribute system

Revision ID: 1f7146b436d7
Revises: 72b9f0a159c3
Create Date: 2025-06-08 14:23:11.523347
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer


# revision identifiers, used by Alembic.
revision: str = "1f7146b436d7"
down_revision: Union[str, None] = "72b9f0a159c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Таблица определений атрибутов
    op.create_table(
        "product_attribute_definitions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_attribute_definitions")),
    )

    # Связь атрибутов с категориями
    op.create_table(
        "attribute_category_link",
        sa.Column("attribute_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["attribute_id"],
            ["product_attribute_definitions.id"],
            ondelete="CASCADE",
            name=op.f("fk_attribute_category_link_attribute_id_product_attribute_definitions")
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            ondelete="CASCADE",
            name=op.f("fk_attribute_category_link_category_id_categories")
        ),
        sa.PrimaryKeyConstraint("attribute_id", "category_id", name=op.f("pk_attribute_category_link")),
    )

    # Значения атрибутов для товаров
    op.create_table(
        "product_attribute_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("attribute_id", sa.Integer(), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["attribute_id"],
            ["product_attribute_definitions.id"],
            ondelete="CASCADE",
            name=op.f("fk_product_attribute_values_attribute_id_product_attribute_definitions")
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
            name=op.f("fk_product_attribute_values_product_id_products")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_attribute_values")),
    )

    # Добавление SKU временно nullable
    op.add_column("products", sa.Column("sku", sa.String(), nullable=True))

    # Добавляем временные значения SKU (на основе ID)
    op.execute("UPDATE products SET sku = 'TEMP-' || id")

    # Теперь делаем sku обязательным
    op.alter_column("products", "sku", nullable=False)

    # Добавляем is_active
    op.add_column("products", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))

    # Удаляем уникальность title
    op.drop_constraint("uq_products_title", "products", type_="unique")

    # Устанавливаем уникальность на sku
    op.create_unique_constraint(op.f("uq_products_sku"), "products", ["sku"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_products_sku"), "products", type_="unique")
    op.create_unique_constraint("uq_products_title", "products", ["title"])
    op.drop_column("products", "is_active")
    op.drop_column("products", "sku")
    op.drop_table("product_attribute_values")
    op.drop_table("attribute_category_link")
    op.drop_table("product_attribute_definitions")
