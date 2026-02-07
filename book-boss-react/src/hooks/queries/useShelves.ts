import { useQuery } from '@tanstack/react-query';
import { shelfService } from '../../services/shelfService';

export const useShelves = () => {
    return useQuery({
        queryKey: ['shelves'],
        queryFn: () => shelfService.getShelves()
    });
};
