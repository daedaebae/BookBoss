import apiClient from './api';

export interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'planned' | 'in_progress' | 'completed' | 'rejected';
    vote_count: number;
    voted_by_me: boolean;
    created_by: string;
    created_at: string;
    admin_note?: string; // Optional admin note
    warning?: string; // Optional warning from backend (e.g. ntfy failure)
}

export const featureService = {
    getFeatures: async (): Promise<FeatureRequest[]> => {
        const response = await apiClient.get('/features');
        return response.data;
    },

    createFeature: async (title: string, description: string): Promise<FeatureRequest> => {
        const response = await apiClient.post('/features', { title, description });
        return response.data;
    },

    toggleVote: async (id: number): Promise<{ success: boolean; voted: boolean; new_count: number }> => {
        const response = await apiClient.post(`/features/${id}/vote`);
        return response.data;
    },

    updateFeature: async (id: number, updates: { status?: string; admin_note?: string }): Promise<void> => {
        await apiClient.put(`/features/${id}`, updates);
    }
};
