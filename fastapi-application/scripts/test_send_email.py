

import asyncio
from mailing.send_email import send_email

asyncio.run(
    send_email(
        recipient="kovalev.connect@gmail.com",
        subject="Тестовое письмо2",
        body="Это тестовое письмо2 из FastAPI проекта",
    )
)