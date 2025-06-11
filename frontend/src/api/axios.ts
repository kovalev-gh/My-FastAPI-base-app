// src/api/axios.ts
import axios, { AxiosRequestConfig, AxiosRequestHeaders } from "axios";

const api = axios.create({
  baseURL: "/api/v1",
});

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

// 🔧 ЭТО СТРОКА ОБЯЗАТЕЛЬНА
export default api;
