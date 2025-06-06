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
    return response.data.map((img: any) => ({
      id: img.id,
      is_main: img.is_main,
      url: `/api/v1${img.image_path}`, // <-- ДОБАВЛЕНО!
    }));
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке изображений для товара ${productId}:`, error?.message ?? error);
    return [];
  }
}
// Загрузка изображения к товару
export async function uploadProductImage(
  productId: number,
  file: File,
  subfolder: string
) {
  const formData = new FormData();
  formData.append("file", file); // ✅ только файл!

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

export async function setMainImage(imageId: number) {
  try {
    const response = await api.post(`/products/images/${imageId}/set-main`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Ошибка при установке главного изображения:", error?.message ?? error);
    throw error;
  }
}