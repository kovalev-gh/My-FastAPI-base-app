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
    <nav
      style={{
        padding: "1rem",
        borderBottom: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Левая часть — навигация */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/products">📦 Продукты</Link>

        {user && (
          <>
            <Link to="/cart">🛒 Корзина</Link>
            <Link to="/orders">📋 Заказы</Link>
            <Link to="/profile">👤 Профиль</Link>
          </>
        )}
      </div>

      {/* Правая часть — админ + выход */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user?.is_superuser && (
          <Link to="/admin">🛠 Панель администратора</Link>
        )}
        {user && <button onClick={handleLogout}>🚪 Выйти</button>}
      </div>
    </nav>
  );
};

export default Header;
