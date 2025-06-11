import api from "./axios";

// 📁 Категории
export async function getCategories() {
  try {
    const res = await api.get("/categories/categories/");
    return res.data;
  } catch (err) {
    console.error("Ошибка при получении категорий", err);
    return [];
  }
}

export async function createCategory(name: string) {
  return api.post("/categories/categories/", { name });
}

export async function updateCategory(id: number, name: string) {
  return api.patch(`/categories/categories/${id}`, { name });
}

export async function deleteCategory(id: number) {
  return api.delete(`/categories/categories/${id}`);
}

// ✅ ИСПРАВЛЕНО: передаём name в query-параметре, а не в теле
export async function restoreCategory(name: string) {
  return api.patch(`/categories/categories/restore?name=${encodeURIComponent(name)}`);
}

// 🏷️ Атрибуты (в контексте категории)
export async function getCategoryAttributes(categoryId: number) {
  return api.get(`/attributes/attributes/category/${categoryId}`);
}

export async function bindAttributeToCategory(categoryId: number, attributeId: number) {
  return api.post(`/attributes/attributes/category/${categoryId}/${attributeId}`);
}

export async function unbindAttributeFromCategory(categoryId: number, attributeId: number) {
  return api.delete(`/attributes/attributes/category/${categoryId}/${attributeId}`);
}
