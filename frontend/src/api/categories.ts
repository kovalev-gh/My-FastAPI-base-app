import api from "./axios";

// 📁 Категории
export async function getCategories() {
  try {
    const res = await api.get("/categories/");  // убрал повтор categories
    return res.data;
  } catch (err) {
    console.error("Ошибка при получении категорий", err);
    return [];
  }
}

export async function createCategory(name: string) {
  try {
    return await api.post("/categories/", { name });  // убрал повтор categories
  } catch (err) {
    console.error("Ошибка при создании категории", err);
    throw err; // ⛔ пробрасываем дальше для компонента
  }
}

export async function updateCategory(id: number, name: string) {
  try {
    return await api.patch(`/categories/${id}`, { name });  // убрал повтор categories
  } catch (err) {
    console.error("Ошибка при обновлении категории", err);
    throw err;
  }
}

export async function deleteCategory(id: number) {
  try {
    return await api.delete(`/categories/${id}`);  // убрал повтор categories
  } catch (err) {
    console.error("Ошибка при удалении категории", err);
    throw err;
  }
}

export async function restoreCategory(name: string) {
  try {
    return await api.patch(`/categories/restore?name=${encodeURIComponent(name)}`);  // убрал повтор categories
  } catch (err) {
    console.error("Ошибка при восстановлении категории", err);
    throw err;
  }
}

// 🏷️ Атрибуты (в контексте категории)
export async function getCategoryAttributes(categoryId: number) {
  try {
    return await api.get(`/attributes/category/${categoryId}`);  // убрал повтор attributes
  } catch (err) {
    console.error("Ошибка при получении атрибутов категории", err);
    throw err;
  }
}

export async function bindAttributeToCategory(categoryId: number, attributeId: number) {
  try {
    return await api.post(`/attributes/category/${categoryId}/${attributeId}`);  // убрал повтор attributes
  } catch (err) {
    console.error("Ошибка при привязке атрибута", err);
    throw err;
  }
}

export async function unbindAttributeFromCategory(categoryId: number, attributeId: number) {
  try {
    return await api.delete(`/attributes/category/${categoryId}/${attributeId}`);  // убрал повтор attributes
  } catch (err) {
    console.error("Ошибка при отвязке атрибута", err);
    throw err;
  }
}
