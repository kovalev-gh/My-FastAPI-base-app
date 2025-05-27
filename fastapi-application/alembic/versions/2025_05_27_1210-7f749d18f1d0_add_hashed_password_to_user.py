"""add hashed_password to user

Revision ID: 7f749d18f1d0
Revises: 58cd8f4c6251
Create Date: 2025-05-27 12:10:58.310734

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f749d18f1d0"
down_revision: Union[str, None] = "58cd8f4c6251"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "users",
        sa.Column("hashed_password", sa.String(), nullable=False, server_default="temp")
    )



def downgrade() -> None:

    op.drop_column("users", "hashed_password")

