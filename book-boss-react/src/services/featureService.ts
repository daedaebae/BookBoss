import apiClient from './api';

export interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'planned' | 'in_progress' | 'completed' | 'rejected' | 'archived';
    vote_count: number;
    voted_by_me: boolean;
    created_by: string;
    created_at: string;
    admin_note?: string; // Optional admin note
    warning?: string; // Optional warning from backend (e.g. ntfy failure)
    type?: 'bug' | 'feature';
    github_issue_number?: number;
    github_issue_url?: string;
}

export const featureService = {
    getFeatures: async (): Promise<FeatureRequest[]> => {
        const response = await apiClient.get('/features');
        return response.data;
    },

    createFeature: async (title: string, description: string, type: 'bug' | 'feature'): Promise<FeatureRequest> => {
        const response = await apiClient.post('/features', { title, description, type });
        return response.data;
    },

    toggleVote: async (id: number): Promise<{ success: boolean; voted: boolean; new_count: number }> => {
        const response = await apiClient.post(`/features/${id}/vote`);
        return response.data;
    },

    updateFeature: async (id: number, updates: { status?: string; admin_note?: string }): Promise<void> => {
        await apiClient.put(`/features/${id}`, updates);
    },

    syncGithubFeatures: async (): Promise<{ success: boolean, message: string }> => {
        const response = await apiClient.post('/features/sync');
        return response.data;
    }
};
