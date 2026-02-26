import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';

export const useSettings = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.getSettings(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Record<string, any>) => {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookboss_token')}`
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update settings');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        }
    });
};
