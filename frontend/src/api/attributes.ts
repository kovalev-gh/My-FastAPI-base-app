import axios from './axios';

export const getAllAttributes = () => axios.get('/api/v1/attributes/attributes');
export const createAttribute = (name: string) => axios.post('/api/v1/attributes/attributes', { name });
export const getCategoryAttributes = (categoryId: number) => axios.get(`/api/v1/attributes/attributes/category/${categoryId}`);
export const bindAttributeToCategory = (categoryId: number, attributeId: number) =>
  axios.post(`/api/v1/attributes/attributes/category/${categoryId}/${attributeId}`);
export const unbindAttributeFromCategory = (categoryId: number, attributeId: number) =>
  axios.delete(`/api/v1/attributes/attributes/category/${categoryId}/${attributeId}`);
