// src/api/orders.ts
import api from "./axios"; // ✅ Правильный импорт

export async function createOrderFromCart() {
  const response = await api.post("/orders/from-cart");
  return response.data;
}

export async function getMyOrders() {
  const response = await api.get("/orders/my");
  return response.data;
}
