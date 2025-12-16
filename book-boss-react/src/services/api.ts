import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('bookboss_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('bookboss_token');
            localStorage.removeItem('bookboss_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
