import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrdersByUser } from "../api/orders";

type OrderItem = {
  id: number;
  product: { title: string; retail_price: number | null };
  quantity: number;
};

type Order = {
  id: number;
  created_at: string;
  status: string;
  items: OrderItem[];
  user: {
    id: number;
    username: string;
  };
};

export default function UserOrdersPage() {
  const { id } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrdersByUser(Number(id))
      .then(setOrders)
      .catch((err) => console.error("❌ Ошибка загрузки заказов:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Загрузка заказов пользователя...</p>;

  const username = orders[0]?.user?.username ?? `ID ${id}`;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Заказы пользователя {username}</h2>
      {orders.length === 0 ? (
        <p>Нет заказов</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc" }}>
            <h3>📦 Заказ #{order.id}</h3>
            <p>🕒 {new Date(order.created_at).toLocaleString()}</p>
            <p>📌 Статус: {order.status}</p>
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product.title} — {item.product.retail_price ?? "нет цены"} ₽ × {item.quantity} шт.
                </li>
              ))}
            </ul>
            <p>
              <strong>💰 Итого:</strong>{" "}
              {order.items.reduce((acc, item) => acc + (item.product.retail_price ?? 0) * item.quantity, 0)} ₽
            </p>
          </div>
        ))
      )}
    </div>
  );
}
