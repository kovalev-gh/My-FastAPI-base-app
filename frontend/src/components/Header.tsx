import { Link } from "react-router-dom";

const Header = () => (
  <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
    <Link to="/products" style={{ marginRight: "1rem" }}>📦 Продукты</Link>
    <Link to="/login" style={{ marginRight: "1rem" }}>🔑 Войти</Link>
    <Link to="/register" style={{ marginRight: "1rem" }}>📝 Регистрация</Link>
    <Link to="/profile">👤 Профиль</Link>
  </nav>
);

export default Header;
