"""cast product fields to INTEGER

Revision ID: 3b2cd7be4b04
Revises: 8b5cb4b3d051
Create Date: 2025-06-02 00:10:00.000000
"""

from alembic import op


# Обязательные идентификаторы миграции:
revision = '3b2cd7be4b04'
down_revision = '8b5cb4b3d051'  # Убедись, что это правильный предыдущий revision ID
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN retail_price TYPE INTEGER USING NULLIF(retail_price, '')::INTEGER
    """)
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN opt_price TYPE INTEGER USING NULLIF(opt_price, '')::INTEGER
    """)
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN quantity TYPE INTEGER USING NULLIF(quantity, '')::INTEGER
    """)


def downgrade():
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN retail_price TYPE TEXT USING retail_price::TEXT
    """)
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN opt_price TYPE TEXT USING opt_price::TEXT
    """)
    op.execute("""
        ALTER TABLE products
        ALTER COLUMN quantity TYPE TEXT USING quantity::TEXT
    """)
