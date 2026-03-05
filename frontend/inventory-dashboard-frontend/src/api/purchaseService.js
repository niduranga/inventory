import apiClient from './api';

// Purchase API calls
export const getPurchases = (params) => apiClient.get('/purchases', { params });
export const getPurchaseById = (id) => apiClient.get(`/purchases/${id}`);
export const createPurchase = (purchaseData) => apiClient.post('/purchases', purchaseData);
export const updatePurchase = (id, purchaseData) => apiClient.put(`/purchases/${id}`, purchaseData);
export const deletePurchase = (id) => apiClient.delete(`/purchases/${id}`); // Soft delete
