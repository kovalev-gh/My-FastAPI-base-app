import api from "./axios";

// Получение списка всех товаров
export async function getProducts(limit = 10, offset = 0) {
  const response = await api.get("/products", {
    params: { limit, offset }
  });

  const data = response.data;

  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: data.total,
    };
  }

  console.error("❌ Неправильный формат ответа:", data);
  return { items: [], total: 0 };
}

// Получение товара по ID
export async function getProductById(productId: number | string) {
  try {
    const response = await api.get(`/products/${productId}`);
    return response;
  } catch (error: any) {
    console.error(`❌ Ошибка при получении продукта ${productId}:`, error?.message ?? error);
    throw error;
  }
}

// Создание нового товара
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

// Обновление товара по ID
export async function updateProduct(productId: number | string, data: {
  title: string;
  description: string;
  retail_price: number;
  opt_price: number;
  quantity: number;
  path?: string;
}) {
  try {
    const response = await api.patch(`/products/${productId}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Ошибка при обновлении продукта ${productId}:`, error?.message ?? error);
    throw error;
  }
}

// ✅ Удаление товара по ID
export async function deleteProduct(productId: number | string) {
  try {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Ошибка при удалении продукта ${productId}:`, error?.message ?? error);
    throw error;
  }
}

// Получение изображений товара
export async function getProductImages(productId: number | string) {
  try {
    const response = await api.get(`/products/${productId}/images`);
    return response.data.map((img: any) => ({
      id: img.id,
      is_main: img.is_main,
      url: `/api/v1${img.image_path}`,
    }));
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке изображений для товара ${productId}:`, error?.message ?? error);
    return [];
  }
}

// Загрузка изображения к товару
export async function uploadProductImage(
  productId: number | string,
  file: File,
  subfolder: string
) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post(
      `/products/${productId}/upload-image?subfolder=${encodeURIComponent(subfolder)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Ошибка при загрузке изображения:", error?.message ?? error);
    throw error;
  }
}

// Установка главного изображения
export async function setMainImage(imageId: number | string) {
  try {
    const response = await api.post(`/products/images/${imageId}/set-main`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Ошибка при установке главного изображения:", error?.message ?? error);
    throw error;
  }
}

// Удаление изображения
export async function deleteImage(imageId: number | string) {
  try {
    const response = await api.delete(`/products/images/${imageId}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Ошибка при удалении изображения:", error?.message ?? error);
    throw error;
  }
}
