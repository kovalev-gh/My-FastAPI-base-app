"""add column phone_number to users

Revision ID: 8b5cb4b3d051
Revises: 83f172b7765a
Create Date: 2025-05-31 15:15:04.882069

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b5cb4b3d051"
down_revision: Union[str, None] = "83f172b7765a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "users", sa.Column("phone_number", sa.String(), nullable=True)
    )
    op.create_index(
        op.f("ix_users_phone_number"), "users", ["phone_number"], unique=True
    )



def downgrade() -> None:

    op.drop_index(op.f("ix_users_phone_number"), table_name="users")
    op.drop_column("users", "phone_number")

