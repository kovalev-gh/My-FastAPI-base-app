"""add is_deleted to categories

Revision ID: 72b9f0a159c3
Revises: c0b136dde882
Create Date: 2025-06-07 14:06:50.259767
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "72b9f0a159c3"
down_revision: Union[str, None] = "c0b136dde882"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку с дефолтным значением false, чтобы избежать ошибки
    op.add_column(
        "categories",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    # Если хочешь — можно сразу убрать server_default после установки значений:
    op.alter_column("categories", "is_deleted", server_default=None)


def downgrade() -> None:
    op.drop_column("categories", "is_deleted")
