import apiClient from './api';

// User API calls
export const getUsers = (params) => apiClient.get('/users', { params });
export const getUserById = (id) => apiClient.get(`/users/${id}`);
export const inviteUser = (userData) => apiClient.post('/users/invite', userData);
export const updateUser = (id, userData) => apiClient.put(`/users/${id}`, userData);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`); // Soft delete
