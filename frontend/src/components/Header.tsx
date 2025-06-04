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
        <Link to="/products/create" style={{ marginRight: "1rem" }}>➕ Добавить</Link>
      )}

      {!user && (
        <>
          <Link to="/login" style={{ marginRight: "1rem" }}>🔑 Войти</Link>
          <Link to="/register">📝 Регистрация</Link>
        </>
      )}

      {user && (
        <>
          <Link to="/profile" style={{ marginRight: "1rem" }}>👤 Профиль</Link>
          <button onClick={handleLogout} style={{ cursor: "pointer" }}>🚪 Выйти</button>
        </>
      )}
    </nav>
  );
};

export default Header;
