import apiClient from './api';

// Category API calls
export const getCategories = (params) => apiClient.get('/categories', { params });
export const getCategoryById = (id) => apiClient.get(`/categories/${id}`);
export const createCategory = (categoryData) => apiClient.post('/categories', categoryData);
export const updateCategory = (id, categoryData) => apiClient.put(`/categories/${id}`, categoryData);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);
