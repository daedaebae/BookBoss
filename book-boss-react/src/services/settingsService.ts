import apiClient from './api';

export const settingsService = {
    // Get all settings
    getSettings: async (): Promise<any> => {
        const response = await apiClient.get('/settings');
        return response.data;
    },

    // Get ABS servers
    getAbsServers: async (): Promise<any[]> => {
        const response = await apiClient.get('/audiobookshelf/servers');
        return response.data;
    },

    // Add ABS server
    addAbsServer: async (serverData: any): Promise<any> => {
        const response = await apiClient.post('/audiobookshelf/servers', serverData);
        return response.data;
    },

    // Delete ABS server
    deleteAbsServer: async (id: number): Promise<void> => {
        await apiClient.delete(`/audiobookshelf/servers/${id}`);
    }
};
