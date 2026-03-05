import apiClient from './api';

// Notification API calls
export const getNotifications = (params) => apiClient.get('/notifications', { params });
export const markNotificationsAsRead = (notificationIds) => apiClient.post('/notifications/mark-read', { notificationIds });
export const deleteNotification = (id) => apiClient.delete(`/notifications/${id}`);
