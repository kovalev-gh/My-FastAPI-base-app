"""add is_deleted to products

Revision ID: 6eb60bb977d9
Revises: 21cbe9d4e403
Create Date: 2025-06-06 17:37:29.914982
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "6eb60bb977d9"
down_revision: Union[str, None] = "21cbe9d4e403"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("FALSE")
        )
    )


def downgrade() -> None:
    op.drop_column("products", "is_deleted")
