"""add is_main to product_images

Revision ID: 21cbe9d4e403
Revises: b06a48fcf653
Create Date: 2025-06-03 14:01:51.356475

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = "21cbe9d4e403"
down_revision: Union[str, None] = "b06a48fcf653"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "product_images", sa.Column("is_main", sa.Boolean(), nullable=False)
    )



def downgrade() -> None:

    op.drop_column("product_images", "is_main")

