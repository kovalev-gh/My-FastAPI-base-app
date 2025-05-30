"""make email not nullable and unique

Revision ID: 55995d5da6f3
Revises: c45a7901369d
Create Date: 2025-05-30 11:35:07.180180
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "55995d5da6f3"
down_revision: Union[str, None] = "c45a7901369d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Защитная проверка: убеждаемся, что NULL email больше нет
    result = op.get_bind().execute(sa.text("SELECT COUNT(*) FROM users WHERE email IS NULL"))
    count = result.scalar()

    if count > 0:
        raise Exception(f"❌ Есть ещё {count} пользователей с NULL email. "
                        f"Заполни email перед применением этой миграции.")

    # Обновляем схему: email теперь обязательный
    op.alter_column("users", "email", nullable=False)

    # Добавляем уникальный индекс
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    # Удаляем уникальный индекс
    op.drop_index("ix_users_email", table_name="users")

    # Разрешаем NULL снова (для отката)
    op.alter_column("users", "email", nullable=True)
