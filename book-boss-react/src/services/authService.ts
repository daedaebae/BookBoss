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
    },

    register: async (username: string, password: string): Promise<LoginResponse> => {
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
    },
};
