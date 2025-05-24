"""rename producttittle to title

Revision ID: 90aa182e46df
Revises: 025281569cb7
Create Date: 2025-05-24 15:02:04.251897

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "90aa182e46df"
down_revision: Union[str, None] = "025281569cb7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "products",
        "producttittle",              # текущее имя в БД
        new_column_name="title"  # правильное имя
    )

def downgrade():
    op.alter_column(
        "products",
        "title",
        new_column_name="producttittle"
    )