import apiClient from './api';
import { type User } from '../types/auth';

interface ServerLoginResponse {
    token: string;
    id: number;
    username: string;
    isAdmin: boolean;
}

interface LoginResponse {
    token: string;
    user: User;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await apiClient.post<ServerLoginResponse>('/login', {
                username,
                password,
            });
            const data = response.data;
            const user: User = {
                id: data.id,
                username: data.username,
                is_admin: data.isAdmin,
            };
            return { token: data.token, user };
        } catch (error: any) {
            // Re-throw with a user-friendly message
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Invalid username or password';
            throw new Error(errorMessage);
        }
    },

    register: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await apiClient.post<ServerLoginResponse>('/register', {
                username,
                password,
            });
            const data = response.data;
            const user: User = {
                id: data.id,
                username: data.username,
                is_admin: data.isAdmin,
            };
            return { token: data.token, user };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
            throw new Error(errorMessage);
        }
    },
};
