"""rename tittle to title

Revision ID: ced37b7bac57
Revises: 90aa182e46df
Create Date: 2025-05-24 15:11:20.146842
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "ced37b7bac57"
down_revision: Union[str, None] = "90aa182e46df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Удаление старого ограничения, если оно ещё есть
    op.drop_constraint("uq_products_producttittle", "products", type_="unique")

    # Создание нового уникального ограничения на 'title'
    op.create_unique_constraint(
        op.f("uq_products_title"), "products", ["title"]
    )


def downgrade() -> None:
    # Удаление нового ограничения
    op.drop_constraint(op.f("uq_products_title"), "products", type_="unique")

    # Восстановление старого ограничения (если нужно)
    op.create_unique_constraint(
        "uq_products_producttittle", "products", ["title"]
    )
