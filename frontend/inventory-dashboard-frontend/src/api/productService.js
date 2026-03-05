import apiClient from './api';

// Product API calls
export const getProducts = (params) => apiClient.get('/products', { params });
export const getProductById = (id) => apiClient.get(`/products/${id}`);
export const createProduct = (productData) => apiClient.post('/products', productData);
export const updateProduct = (id, productData) => apiClient.put(`/products/${id}`, productData);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
