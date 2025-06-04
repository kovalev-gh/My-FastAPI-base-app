import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <Link to="/products" style={{ marginRight: "1rem" }}>📦 Продукты</Link>

      {user?.is_superuser && (
        <>
          <Link to="/products/create" style={{ marginRight: "1rem" }}>➕ Добавить</Link>
          <Link to="/users" style={{ marginRight: "1rem" }}>👥 Пользователи</Link>
        </>
      )}

      {user && (
        <>
          <Link to="/cart" style={{ marginRight: "1rem" }}>🛒 Корзина</Link>
          <Link to="/profile" style={{ marginRight: "1rem" }}>👤 Профиль</Link>
          <Link to="/orders" style={{ marginRight: "1rem" }}>📋 Заказы</Link>

          <button onClick={handleLogout} style={{ cursor: "pointer" }}>🚪 Выйти</button>
        </>
      )}

      {!user && (
        <>
          <Link to="/login" style={{ marginRight: "1rem" }}>🔑 Войти</Link>
          <Link to="/register">📝 Регистрация</Link>
        </>
      )}
    </nav>
  );
};

export default Header;
