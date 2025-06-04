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
import OrdersPage from "./pages/OrdersPage";
import UserList from "./pages/UserList";
import UserOrdersPage from "./pages/UserOrdersPage";

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

        {/* Создание продукта — только для суперпользователя */}
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

        {/* Страница пользователей — только для суперпользователя */}
        <Route
          path="/users"
          element={
            user?.is_superuser ? (
              <UserList />
            ) : (
              <Navigate to="/products" replace />
            )
          }
        />

        {/* Заказы конкретного пользователя — только для суперпользователя */}
        <Route
          path="/users/:userId/orders"
          element={
            user?.is_superuser ? (
              <UserOrdersPage />
            ) : (
              <Navigate to="/products" replace />
            )
          }
        />

        {/* Аутентификация */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        {/* Корзина и заказы */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />

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
