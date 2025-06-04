// src/api/axios.ts
import axios from "axios";

// Создаём экземпляр axios с базовым URL
const api = axios.create({
  baseURL: "/api/v1",
});

// Добавляем интерсептор запроса для токена авторизации
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
    console.log("🔐 Token attached:", token);
  } else {
    console.warn("⚠️ Токен не найден в localStorage");
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
