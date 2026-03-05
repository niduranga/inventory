import apiClient from './api';

// Inventory API calls
export const stockIn = (data) => apiClient.post('/inventory/stock-in', data);
export const stockOut = (data) => apiClient.post('/inventory/stock-out', data);
export const adjustStock = (data) => apiClient.post('/inventory/adjust', data);
export const getStockHistory = (params) => apiClient.get('/inventory/history', { params });
export const getProductStockHistory = (productId, params) => apiClient.get(`/inventory/product/${productId}`, { params });
