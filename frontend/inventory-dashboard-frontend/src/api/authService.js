import apiClient from './api';

// Auth API calls
export const loginUser = (userData) => apiClient.post('/auth/login', userData);
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const getUserProfile = (token) => apiClient.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } }); // Example, if profile needs explicit token header
