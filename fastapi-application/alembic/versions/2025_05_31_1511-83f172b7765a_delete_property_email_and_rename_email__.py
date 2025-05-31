"""delete property email and rename email_ to email

Revision ID: 83f172b7765a
Revises: 55995d5da6f3
Create Date: 2025-05-31 15:11:21.122429

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "83f172b7765a"
down_revision: Union[str, None] = "55995d5da6f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    pass



def downgrade() -> None:

    pass

