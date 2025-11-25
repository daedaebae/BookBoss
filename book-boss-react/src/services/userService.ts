import apiClient from './api';
import { type PrivacySettings } from '../types/user';

export const userService = {
    updateProfile: async (privacySettings: PrivacySettings): Promise<void> => {
        await apiClient.put('/users/profile', { privacy_settings: privacySettings });
    }
};
