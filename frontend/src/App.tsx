import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import ProductForm from "./pages/ProductForm";
import Header from "./components/Header";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Редирект с корня на список товаров */}
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* Список, детальная и создание */}
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/create" element={<ProductForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />

        {/* 404 — если путь не найден */}
        <Route path="*" element={<div style={{ padding: "2rem" }}>404 – Страница не найдена</div>} />
      </Routes>
    </Router>
  );
}

export default App;
