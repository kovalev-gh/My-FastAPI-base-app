import api from './axios';

export const getAllAttributes = () =>
  api.get('/attributes').then(res => res);  // убрали .data

export const createAttribute = (data: { name: string; unit?: string }) =>
  api.post('/attributes', data).then(res => res);

export const getAttributesByCategory = (categoryId: number) =>
  api.get(`/attributes/category/${categoryId}`).then(res => res);

export const bindAttributeToCategory = (categoryId: number, attributeId: number) =>
  api.post(`/attributes/category/${categoryId}/${attributeId}`).then(res => res);

export const unbindAttributeFromCategory = (categoryId: number, attributeId: number) =>
  api.delete(`/attributes/category/${categoryId}/${attributeId}`).then(res => res);
