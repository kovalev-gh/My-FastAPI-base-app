// src/api/orders.ts
import api from "./axios"; // ✅ Правильный импорт

// Создать заказ из корзины
export async function createOrderFromCart() {
  const response = await api.post("/orders/from-cart");
  return response.data;
}

// Получить заказы текущего пользователя
export async function getMyOrders() {
  const response = await api.get("/orders/my");
  return response.data;
}

// Получить заказы по user_id (для суперпользователей)
export async function getOrdersByUser(userId: number) {
  const response = await api.get("/orders", {
    params: { user_id: userId },
  });
  return response.data;
}
export async function getOrdersForAdmin() {
  try {
    const response = await api.get("/orders"); // FastAPI ручка: GET /api/v1/orders
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("403");
    }
    throw new Error("Ошибка загрузки заказов");
  }
}