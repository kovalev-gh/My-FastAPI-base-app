import api from "./axios";

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

export async function restoreCategory(name: string) {
  return api.patch("/categories/categories/restore", { name });
}
