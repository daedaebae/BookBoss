import apiClient from './api';
import { type User } from '../types/auth';

interface LoginResponse {
    token: string;
    user: User;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/login', {
            username,
            password,
        });
        return response.data;
    },

    register: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/register', {
            username,
            password,
        });
        return response.data;
    },
};
