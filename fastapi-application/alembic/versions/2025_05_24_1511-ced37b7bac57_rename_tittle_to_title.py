"""rename tittle to title

Revision ID: ced37b7bac57
Revises: 025281569cb7
Create Date: 2025-05-24 15:11:20.146842
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "ced37b7bac57"
down_revision: Union[str, None] = "025281569cb7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Безопасно удалить старое ограничение, если оно существует
    conn.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_producttittle'
            ) THEN
                ALTER TABLE products DROP CONSTRAINT uq_products_producttittle;
            END IF;
        END
        $$;
    """))

    # Безопасно создать новое ограничение, если его ещё нет
    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_title'
            ) THEN
                ALTER TABLE products
                ADD CONSTRAINT {op.f("uq_products_title")} UNIQUE (title);
            END IF;
        END
        $$;
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Безопасно удалить новое ограничение, если оно существует
    conn.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_title'
            ) THEN
                ALTER TABLE products DROP CONSTRAINT uq_products_title;
            END IF;
        END
        $$;
    """))

    # Восстановить старое ограничение, только если его нет
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_producttittle'
            ) THEN
                ALTER TABLE products
                ADD CONSTRAINT uq_products_producttittle UNIQUE (title);
            END IF;
        END
        $$;
    """))
