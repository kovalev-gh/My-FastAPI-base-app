import { useEffect, useState } from "react";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";

type OrderItem = {
  quantity: number;
  product: {
    title: string;
    retail_price: number | null;
  };
};

type Order = {
  id: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user_id");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const endpoint = userId ? `/orders?user_id=${userId}` : "/orders/my";
        const response = await api.get(endpoint);
        const sorted = response.data.sort(
          (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      } catch (error) {
        console.error("Ошибка при загрузке заказов:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка заказов...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Мои заказы</h2>
      {orders.length === 0 ? (
        <p>Нет заказов</p>
      ) : (
        orders.map((order) => {
          const total = order.items.reduce((sum, item) => {
            const price = item.product.retail_price ?? 0;
            return sum + price * item.quantity;
          }, 0);

          return (
            <div key={order.id} style={{ marginBottom: "2rem" }}>
              <h3>📦 Заказ #{order.id}</h3>
              <p>🕒 {new Date(order.created_at).toLocaleString()}</p>
              <p>📌 Статус: {order.status}</p>
              <ul>
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.product.title} — {item.product.retail_price ?? "нет цены"} ₽ × {item.quantity} шт.
                  </li>
                ))}
              </ul>
              <strong>💰 Итог: {total} ₽</strong>
            </div>
          );
        })
      )}
    </div>
  );
}
