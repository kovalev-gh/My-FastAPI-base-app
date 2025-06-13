"""Add meta_ prefix validation and fix attribute names

Revision ID: 40f24a07cb19
Revises: 1f7146b436d7
Create Date: 2025-06-12 14:35:38.575325
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "40f24a07cb19"
down_revision: Union[str, None] = "1f7146b436d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Поля модели Product, с которыми нельзя конфликтовать
RESERVED_FIELDS = {
    "id", "title", "sku", "retail_price", "opt_price", "quantity",
    "description", "is_deleted", "is_active", "category_id"
}


def upgrade():
    conn = op.get_bind()

    result = conn.execute(text("""
        SELECT id, name FROM product_attribute_definitions
        WHERE name NOT LIKE 'meta_%'
    """))

    for row in result:
        row_data = row._mapping
        attr_id = row_data["id"]
        name = row_data["name"]

        if name in RESERVED_FIELDS:
            print(f"❌ Удаляем конфликтующий атрибут: {name}")
            conn.execute(text("""
                DELETE FROM product_attribute_values
                WHERE attribute_id = :attr_id
            """), {"attr_id": attr_id})

            conn.execute(text("""
                DELETE FROM product_attribute_definitions
                WHERE id = :attr_id
            """), {"attr_id": attr_id})
        else:
            new_name = f"meta_{name}"
            print(f"🔄 Переименовываем {name} → {new_name}")
            conn.execute(text("""
                UPDATE product_attribute_definitions
                SET name = :new_name
                WHERE id = :attr_id
            """), {"new_name": new_name, "attr_id": attr_id})


def downgrade():
    conn = op.get_bind()

    result = conn.execute(text("""
        SELECT id, name FROM product_attribute_definitions
        WHERE name LIKE 'meta_%'
    """))

    for row in result:
        row_data = row._mapping
        attr_id = row_data["id"]
        name = row_data["name"]
        raw_name = name.removeprefix("meta_")

        if raw_name not in RESERVED_FIELDS:
            print(f"↩️ Откатываем {name} → {raw_name}")
            conn.execute(text("""
                UPDATE product_attribute_definitions
                SET name = :raw_name
                WHERE id = :attr_id
            """), {"raw_name": raw_name, "attr_id": attr_id})
