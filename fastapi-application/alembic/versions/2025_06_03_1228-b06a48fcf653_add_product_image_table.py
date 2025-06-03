"""add product_image table

Revision ID: b06a48fcf653
Revises: b930b924a9ca
Create Date: 2025-06-03 12:28:07.384729

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b06a48fcf653"
down_revision: Union[str, None] = "b930b924a9ca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "product_images",
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("image_path", sa.String(), nullable=False),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_images_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_images")),
    )



def downgrade() -> None:

    op.drop_table("product_images")

