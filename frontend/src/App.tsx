import { Routes, Route, Navigate } from "react-router-dom";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import ProductForm from "./pages/ProductForm";
import Header from "./components/Header";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import CartPage from "./pages/CartPage";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <Routes>
        {/* Редирект с корня */}
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* Основные страницы */}
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* Страница создания товара — доступна только суперпользователю */}
        <Route
          path="/products/create"
          element={
            user?.is_superuser ? (
              <ProductForm />
            ) : (
              <Navigate to="/products" replace />
            )
          }
        />

        {/* Аутентификация */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<CartPage />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div style={{ padding: "2rem" }}>404 – Страница не найдена</div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
