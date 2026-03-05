import apiClient from './api';

// Report API calls
export const getSalesReports = (params) => apiClient.get('/reports/sales', { params });
export const getProfitReports = (params) => apiClient.get('/reports/profit', { params });
export const getInventoryReports = (params) => apiClient.get('/reports/inventory', { params });
export const getTopProducts = (params) => apiClient.get('/reports/top-products', { params });
