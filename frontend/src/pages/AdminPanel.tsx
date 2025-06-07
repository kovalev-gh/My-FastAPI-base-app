import { Link } from "react-router-dom";

export default function AdminPanel() {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>🛠 Панель администратора</h2>
      <ul>
        <li>
          <Link to="/users">👥 Управление пользователями</Link>
        </li>
        <li>
          <Link to="/products/create">➕ Добавить продукт</Link>
        </li>
        <li>
          <Link to="/admin/products">📝 Редактировать продукты</Link>
        </li>
        <li>
          <Link to="/orders/all">📋 Все заказы</Link>
        </li>
        <li>
          <Link to="/admin/categories">📂 Управление категориями</Link>
        </li>
      </ul>
    </div>
  );
}
