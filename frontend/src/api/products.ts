import api from "./axios";

// Получение списка всех товаров
export async function getProducts() {
  try {
    const response = await api.get("/products");

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("❌ Ожидался массив, а получено:", response.data);
      return [];
    }
  } catch (error: any) {
    console.error("❌ Ошибка при получении товаров:", error?.message ?? error);
    if (error?.request) {
      console.debug("🔍 Запрос:", error.request);
    }
    return [];
  }
}

// Создание нового товара (только для суперпользователя)
export async function createProduct(data: {
  title: string;
  description: string;
  retail_price: number;
  opt_price: number;
  quantity: number;
}) {
  try {
    const response = await api.post("/products", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Ошибка при создании продукта:", error?.message ?? error);
    throw error;
  }
}

// Получение изображений товара
export async function getProductImages(productId: number) {
  try {
    const response = await api.get(`/products/${productId}/images`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке изображений для товара ${productId}:`, error?.message ?? error);
    return [];
  }
}
