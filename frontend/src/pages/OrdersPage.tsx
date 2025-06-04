// src/pages/OrdersPage.tsx
import { useEffect, useState } from "react";
import { getMyOrders } from "../api/orders";

type OrderItem = {
  id: number;
  quantity: number;
  product: {
    title: string;
    retail_price: number | null;
  };
};

type Order = {
  id: number;
  created_at: string;
  status: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        // Сортировка: новые заказы сверху
        const sorted = data.sort(
          (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      })
      .catch((err) => console.error("❌ Ошибка загрузки заказов", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка заказов...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Мои заказы</h2>
      {orders.length === 0 ? (
        <p>У вас нет заказов</p>
      ) : (
        orders.map((order) => {
          const total = order.items.reduce((acc, item) => {
            const price = item.product.retail_price ?? 0;
            return acc + price * item.quantity;
          }, 0);

          return (
            <div key={order.id} style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
              <h3>📦 Заказ #{order.id}</h3>
              <p>🕒 Создан: {new Date(order.created_at).toLocaleString()}</p>
              <p>📍 Статус: <strong>{order.status}</strong></p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.product.title}</strong> —{" "}
                    {item.product.retail_price ?? "нет цены"} ₽ × {item.quantity} шт.
                  </li>
                ))}
              </ul>
              <p><strong>💰 Итого:</strong> {total} ₽</p>
            </div>
          );
        })
      )}
    </div>
  );
}
