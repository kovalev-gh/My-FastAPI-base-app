from email.message import EmailMessage
import aiosmtplib
from core.config import settings  # импорт настроек из твоего Settings

async def send_email(
    recipient: str,
    subject: str,
    body: str,
):
    message = EmailMessage()
    message["From"] = settings.smtp.get_from()
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.smtp.host,
        port=settings.smtp.port,
        start_tls=True,
        username=settings.smtp.user,
        password=settings.smtp.password,
    )
