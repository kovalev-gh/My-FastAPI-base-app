"""add new columns to products

Revision ID: 025281569cb7
Revises: f04281c03f95
Create Date: 2025-05-24 13:49:50.349217

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "025281569cb7"
down_revision: Union[str, None] = "f04281c03f95"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products", sa.Column("retail_price", sa.String(), nullable=False)
    )
    op.add_column(
        "products", sa.Column("opt_price", sa.String(), nullable=False)
    )
    op.add_column(
        "products", sa.Column("description", sa.String(), nullable=False)
    )
    op.add_column(
        "products", sa.Column("quantity", sa.String(), nullable=False)
    )



def downgrade() -> None:

    op.drop_column("products", "quantity")
    op.drop_column("products", "description")
    op.drop_column("products", "opt_price")
    op.drop_column("products", "retail_price")
