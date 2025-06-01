from dotenv import load_dotenv
load_dotenv()

import asyncio
import sqlalchemy as sa
from pathlib import Path
import sys

# Добавляем корневую директорию в sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from core.models.db_helper import db_helper
from core.models.user import User


async def backfill_null_phone_numbers():
    async with db_helper.session_factory() as session:
        result = await session.stream(
            sa.select(User).where(User.phone_number.is_(None))
        )
        count = 0

        async for row in result:
            user = row[0]
            user.phone_number = "88888888888"
            count += 1

        await session.commit()
        print(f"Обновлено пользователей: {count}")


if __name__ == "__main__":
    asyncio.run(backfill_null_phone_numbers())
