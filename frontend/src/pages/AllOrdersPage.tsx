import { useEffect, useState } from "react";
import { getOrdersForAdmin } from "../api/orders";

type OrderItem = {
  id?: number; // 👈 делаем необязательным на всякий случай
  product: { title: string; retail_price: number | null };
  quantity: number;
};

type Order = {
  id: number;
  created_at: string;
  status: string;
  user: { id: number; username: string };
  items: OrderItem[];
};

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    getOrdersForAdmin()
      .then(setOrders)
      .catch((err) => {
        if (err.message === "403") {
          setAccessDenied(true);
        } else {
          console.error("Ошибка загрузки заказов:", err);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка заказов...</p>;
  if (accessDenied) return <p>⛔ Недостаточно прав для просмотра заказов.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Все заказы</h2>
      {orders.length === 0 ? (
        <p>Нет заказов</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              border: "1px solid #ccc",
            }}
          >
            <h3>
              📦 Заказ #{order.id} — 👤 {order.user.username} (ID: {order.user.id})
            </h3>
            <p>🕒 {new Date(order.created_at).toLocaleString()}</p>
            <p>📌 Статус: {order.status}</p>
            <ul>
              {order.items.map((item, index) => (
                <li key={item.id ?? `${order.id}-${index}`}>
                  {item.product.title} — {item.product.retail_price ?? "нет цены"} ₽ ×{" "}
                  {item.quantity} шт.
                </li>
              ))}
            </ul>
            <p>
              <strong>💰 Итого:</strong>{" "}
              {order.items.reduce(
                (acc, item) =>
                  acc + (item.product.retail_price ?? 0) * item.quantity,
                0
              )}{" "}
              ₽
            </p>
          </div>
        ))
      )}
    </div>
  );
}
