from dotenv import load_dotenv
load_dotenv()

import sqlalchemy as sa
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import asyncio
from core.models.db_helper import db_helper
from core.models.user import User


async def backfill_null_emails():
    async with db_helper.session_factory() as session:
        result = await session.stream(sa.select(User).where(User.email.is_(None)))
        count = 0

        async for row in result:
            user = row[0]
            user.email_ = f"{user.username}@domain.com"
            count += 1

        await session.commit()
        print(f"Обновлено пользователей: {count}")


if __name__ == "__main__":
    asyncio.run(backfill_null_emails())
