// src/api/products.ts
import axios from "axios";

// Базовый URL для всех запросов к backend API
const API_BASE_URL = "/api/v1"; // <-- теперь без localhost!

// Получение списка всех товаров
export async function getProducts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`);

    // Убедись, что бекенд возвращает именно массив:
    // если [{...}, {...}] — оставляем так
    // если { products: [...] } — верни response.data.products
    if (Array.isArray(response.data)) {
  return response.data;
} else {
  console.error("❌ Ожидался массив, а пришло:", response.data);
  return [];
}
  } catch (error) {
    console.error("❌ Ошибка при получении продуктов:", error);
    return []; // возвращаем пустой список в случае ошибки
  }
}

export async function createProduct(data: {
  title: string;
  description: string;
  retail_price: number;
  opt_price: number;
  quantity: number;
}) {
  const token = localStorage.getItem("token");

  const response = await axios.post("/api/v1/products", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
