import api from './axios';

export const getAllAttributes = () =>
  api.get('/attributes').then(res => res.data);  // ✅ ВОТ ЭТО ГЛАВНОЕ!

export const createAttribute = (data: { name: string; unit?: string }) =>
  api.post('/attributes', data).then(res => res.data);

export const getAttributesByCategory = (categoryId: number) =>
  api.get(`/attributes/category/${categoryId}`).then(res => res.data);

export const bindAttributeToCategory = (categoryId: number, attributeId: number) =>
  api.post(`/attributes/category/${categoryId}/${attributeId}`).then(res => res.data);

export const unbindAttributeFromCategory = (categoryId: number, attributeId: number) =>
  api.delete(`/attributes/category/${categoryId}/${attributeId}`).then(res => res.data);
