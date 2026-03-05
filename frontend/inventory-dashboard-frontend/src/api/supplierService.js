import apiClient from './api';

// Supplier API calls
export const getSuppliers = (params) => apiClient.get('/suppliers', { params });
export const getSupplierById = (id) => apiClient.get(`/suppliers/${id}`);
export const createSupplier = (supplierData) => apiClient.post('/suppliers', supplierData);
export const updateSupplier = (id, supplierData) => apiClient.put(`/suppliers/${id}`, supplierData);
export const deleteSupplier = (id) => apiClient.delete(`/suppliers/${id}`);
