"""add orders, order_items, and update users

Revision ID: c45a7901369d
Revises: 7dd46f4903ca
Create Date: 2025-05-30 11:23:50.542063
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c45a7901369d"
down_revision: Union[str, None] = "7dd46f4903ca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создаём таблицу заказов
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "PAID", "SHIPPED", "CANCELLED", name="orderstatus"),
            nullable=True,
        ),
        sa.Column("address", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_orders_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_orders")),
    )
    op.create_index(op.f("ix_orders_id"), "orders", ["id"], unique=False)

    # Создаём таблицу строк заказов
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_order_items_order_id_orders"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_order_items_product_id_products"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_items")),
    )
    op.create_index(op.f("ix_order_items_id"), "order_items", ["id"], unique=False)

    # Обновляем таблицу пользователей
    op.add_column("users", sa.Column("full_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("email", sa.String(), nullable=True))  # временно nullable
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Удаляем старое ограничение по username
    op.drop_constraint("uq_users_username", "users", type_="unique")

    # Пересоздаём индекс (username)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # ❗ Не создаём уникальный индекс на email пока — сделаешь позже в следующей миграции


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.drop_column("users", "is_superuser")
    op.drop_column("users", "is_active")
    op.drop_column("users", "email")
    op.drop_column("users", "full_name")

    op.drop_index(op.f("ix_order_items_id"), table_name="order_items")
    op.drop_table("order_items")

    op.drop_index(op.f("ix_orders_id"), table_name="orders")
    op.drop_table("orders")

    sa.Enum(name="orderstatus").drop(op.get_bind(), checkfirst=False)
