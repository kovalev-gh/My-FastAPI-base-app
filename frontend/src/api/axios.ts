// src/api/axios.ts
import axios, { AxiosRequestConfig, AxiosRequestHeaders } from "axios";

// Создаём экземпляр axios с базовым URL
const api = axios.create({
  baseURL: "/api/v1",
});

// Добавляем интерсептор запроса для токена авторизации
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token) {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }

      (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
      console.log("🔐 Token attached:", token);
    } else {
      console.warn("⚠️ Токен не найден в localStorage");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
