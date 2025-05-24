"""create products table

Revision ID: f04281c03f95
Revises: 6f17b7a3c495
Create Date: 2025-05-24 12:37:28.440924

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f04281c03f95"
down_revision: Union[str, None] = "6f17b7a3c495"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "products",
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint(
            "title", name=op.f("uq_products_title")
        ),
    )



def downgrade() -> None:

    op.drop_table("products")

