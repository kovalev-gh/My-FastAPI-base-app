"""make retail_price and others nullable

Revision ID: 58cd8f4c6251
Revises: ced37b7bac57
Create Date: 2025-05-24 15:23:12.654264

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "58cd8f4c6251"
down_revision: Union[str, None] = "ced37b7bac57"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.alter_column(
        "products", "retail_price", existing_type=sa.VARCHAR(), nullable=True
    )
    op.alter_column(
        "products", "opt_price", existing_type=sa.VARCHAR(), nullable=True
    )
    op.alter_column(
        "products", "quantity", existing_type=sa.VARCHAR(), nullable=True
    )



def downgrade() -> None:

    op.alter_column(
        "products", "quantity", existing_type=sa.VARCHAR(), nullable=False
    )
    op.alter_column(
        "products", "opt_price", existing_type=sa.VARCHAR(), nullable=False
    )
    op.alter_column(
        "products", "retail_price", existing_type=sa.VARCHAR(), nullable=False
    )

