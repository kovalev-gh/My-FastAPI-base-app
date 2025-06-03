import { Link } from "react-router-dom";

const Header = () => (
  <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
    <Link to="/products" style={{ marginRight: "1rem" }}>📦 Продукты</Link>
    <Link to="/products/create">➕ Добавить</Link>
  </nav>
);

export default Header;
