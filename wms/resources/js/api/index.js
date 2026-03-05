// resources/js/api/index.js

import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // Assuming your Laravel API routes are prefixed with /api
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

// You can add interceptors here for authentication tokens, error handling, etc.
// apiClient.interceptors.request.use(config => {
//     const token = localStorage.getItem('token'); // Example: retrieve token
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

export default {
    products: {
        getAll: () => apiClient.get('/products'),
        getById: (id) => apiClient.get(`/products/${id}`),
        create: (data) => apiClient.post('/products', data),
        update: (id, data) => apiClient.put(`/products/${id}`, data),
        delete: (id) => apiClient.delete(`/products/${id}`),
    },
    locations: {
        getAll: () => apiClient.get('/locations'),
        getById: (id) => apiClient.get(`/locations/${id}`),
        create: (data) => apiClient.post('/locations', data),
        update: (id, data) => apiClient.put(`/locations/${id}`, data),
        delete: (id) => apiClient.delete(`/locations/${id}`),
    },
    stock: {
        handleIn: (data) => apiClient.post('/stock/in', { ...data, type: 'In' }),
        handleOut: (data) => apiClient.post('/stock/out', { ...data, type: 'Out' }),
        handleTransfer: (data) => apiClient.post('/stock/transfer', { ...data, type: 'Transfer' }),
        getProductStock: (productId) => apiClient.get(`/stock/product/${productId}/levels`),
        getProductStockLogs: (productId, params) => apiClient.get(`/stock/product/${productId}/logs`, { params }),
        getLocationStockLogs: (locationId, params) => apiClient.get(`/stock/location/${locationId}/logs`, { params }),
        triggerLowStockAlerts: () => apiClient.post('/stock/alerts/trigger') // Example endpoint
    }
};
