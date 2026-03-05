import apiClient from './api';

// Sale API calls
export const getSales = (params) => apiClient.get('/sales', { params });
export const getSaleById = (id) => apiClient.get(`/sales/${id}`);
export const createSale = (saleData) => apiClient.post('/sales', saleData);
export const updateSale = (id, saleData) => apiClient.put(`/sales/${id}`, saleData);
export const cancelSale = (id) => apiClient.delete(`/sales/${id}`); // Soft delete/cancel
