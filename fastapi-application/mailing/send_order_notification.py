from mailing.send_email import send_email
from core.models.order import Order
from core.config import settings


async def send_order_notification_email(order: Order):
    subject = f"Новый заказ #{order.id}"

    # Строим список строк вида: - [ID] Название x Кол-во
    items_text = "\n".join([
        f"- [{item.product.id}] {item.product.title} x {item.quantity}"
        for item in order.items
    ])

    body = f"""
Новый заказ от пользователя: {order.user.username}
Email: {order.user.email}
Телефон: {order.user.phone_number}
Имя: {order.user.full_name}

ID заказа: {order.id}
Статус: {order.status}
Товары:
{items_text}
"""

    await send_email(
        recipient=settings.smtp.user,  # или адрес менеджера
        subject=subject,
        body=body,
    )
