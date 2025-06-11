import api from './axios';

// Получить все доступные атрибуты
export const getAllAttributes = () =>
  api.get('/attributes/attributes');

// ✅ Создать новый атрибут с названием и (необязательной) единицей измерения
export const createAttribute = (data: { name: string; unit?: string }) =>
  api.post('/attributes/attributes', data);

// Получить все атрибуты, связанные с категорией
export const getCategoryAttributes = (categoryId: number) =>
  api.get(`/attributes/attributes/category/${categoryId}`);

// Привязать атрибут к категории
export const bindAttributeToCategory = (categoryId: number, attributeId: number) =>
  api.post(`/attributes/attributes/category/${categoryId}/${attributeId}`);

// Отвязать атрибут от категории
export const unbindAttributeFromCategory = (categoryId: number, attributeId: number) =>
  api.delete(`/attributes/attributes/category/${categoryId}/${attributeId}`);
