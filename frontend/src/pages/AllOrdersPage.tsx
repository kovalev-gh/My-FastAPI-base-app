import { useEffect, useState } from "react";
import { getOrdersForAdmin } from "../api/orders";

type OrderItem = {
  id?: number;
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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Фильтры
  const [searchUsername, setSearchUsername] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    getOrdersForAdmin()
      .then((data) => {
        setOrders(data);
        setFilteredOrders(data);
      })
      .catch((err) => {
        if (err.message === "403") setAccessDenied(true);
        else console.error("Ошибка загрузки заказов:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (searchUsername) {
      filtered = filtered.filter((o) =>
        o.user.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((o) => new Date(o.created_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      filtered = filtered.filter((o) => new Date(o.created_at) <= to);
    }

    filtered.sort((a, b) => {
      const totalA = a.items.reduce(
        (acc, i) => acc + (i.product.retail_price ?? 0) * i.quantity,
        0
      );
      const totalB = b.items.reduce(
        (acc, i) => acc + (i.product.retail_price ?? 0) * i.quantity,
        0
      );

      if (sortBy === "date") {
        const diff =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === "asc" ? diff : -diff;
      }

      return sortDir === "asc" ? totalA - totalB : totalB - totalA;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1); // сброс на первую страницу при изменении фильтров
  }, [orders, searchUsername, statusFilter, dateFrom, dateTo, sortBy, sortDir]);

  const resetFilters = () => {
    setSearchUsername("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setSortDir("desc");
  };

  // Пагинация — расчёт видимых заказов
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) return <p>Загрузка заказов...</p>;
  if (accessDenied) return <p>⛔ Недостаточно прав для просмотра заказов.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Все заказы</h2>

      {/* 🔍 Фильтры */}
      <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Поиск по имени пользователя"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="pending">⏳ Ожидает</option>
          <option value="completed">✅ Завершён</option>
          <option value="canceled">❌ Отменён</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="date">📅 По дате</option>
          <option value="total">💰 По сумме</option>
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
          <option value="asc">↑ Возрастание</option>
          <option value="desc">↓ Убывание</option>
        </select>
        <button onClick={resetFilters}>♻️ Сбросить</button>
      </div>

      {/* 📋 Список заказов */}
      {currentOrders.length === 0 ? (
        <p>Нет заказов по выбранным фильтрам</p>
      ) : (
        currentOrders.map((order) => (
          <div key={order.id} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc" }}>
            <h3>📦 Заказ #{order.id} — 👤 {order.user.username} (ID: {order.user.id})</h3>
            <p>🕒 {new Date(order.created_at).toLocaleString()}</p>
            <p>📌 Статус: {order.status}</p>
            <ul>
              {order.items.map((item, index) => (
                <li key={item.id ?? `${order.id}-${index}`}>
                  {item.product.title} — {item.product.retail_price ?? "нет цены"} ₽ × {item.quantity} шт.
                </li>
              ))}
            </ul>
            <p>
              <strong>💰 Итого:</strong>{" "}
              {order.items.reduce(
                (acc, item) => acc + (item.product.retail_price ?? 0) * item.quantity,
                0
              )} ₽
            </p>
          </div>
        ))
      )}

      {/* 🔽 Пагинация */}
      {totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            ⬅️
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              style={{ fontWeight: currentPage === i + 1 ? "bold" : "normal" }}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            ➡️
          </button>
        </div>
      )}
    </div>
  );
}
