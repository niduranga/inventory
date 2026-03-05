import axios from 'axios';
import { store } from '../store/store';
import { logout, clearAuthError } from '../features/auth/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        store.dispatch(clearAuthError());
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.message || 'An unexpected error occurred.';

            if (statusCode === 401 || (statusCode === 403 && errorMessage.includes('token'))) {
                store.dispatch(logout());
            } else if (statusCode === 403) {
                console.warn(`Forbidden Access: ${errorMessage}`);
            } else {
                console.error(`API Error (${statusCode}): ${errorMessage}`);
            }
            return Promise.reject(error.response.data || { message: errorMessage });
        } else if (error.request) {
            console.error('API Error: No response received', error.request);
            return Promise.reject({ message: 'Server is unreachable. Please check your connection.' });
        } else {
            console.error('API Error: Request setup error', error.message);
            return Promise.reject({ message: 'Error setting up request.' });
        }
    }
);

export default apiClient;