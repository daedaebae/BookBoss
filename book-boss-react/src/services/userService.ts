import apiClient from './api';
import { type User } from '../types/auth';
import { type PrivacySettings } from '../types/user';

export const userService = {
    // Get all users (Admin only)
    getUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    // Get single user
    getUser: async (id: number): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    // Create user (Admin only)
    createUser: async (userData: any): Promise<User> => {
        const response = await apiClient.post<User>('/users', userData);
        return response.data;
    },

    // Update user
    updateUser: async (id: number, userData: any): Promise<User> => {
        const response = await apiClient.put<User>(`/users/${id}`, userData);
        return response.data;
    },

    // Delete user (Admin only)
    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    // Get current user profile
    getProfile: async (): Promise<User & { privacy_settings: PrivacySettings }> => {
        const response = await apiClient.get<User & { privacy_settings: PrivacySettings }>('/users/profile');
        return response.data;
    },

    // Update current user profile
    updateProfile: async (data: { privacy_settings?: PrivacySettings, password?: string }): Promise<void> => {
        await apiClient.put('/users/profile', data);
    }
};
