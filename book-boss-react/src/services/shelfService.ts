import apiClient from './api';
import { type Shelf } from '../types/shelf';

export const shelfService = {
    getShelves: async (): Promise<Shelf[]> => {
        const response = await apiClient.get<Shelf[]>('/shelves');
        return response.data;
    },

    createShelf: async (name: string): Promise<Shelf> => {
        const response = await apiClient.post<Shelf>('/shelves', { name });
        return response.data;
    },

    deleteShelf: async (id: number): Promise<void> => {
        await apiClient.delete(`/shelves/${id}`);
    },

    addBookToShelf: async (shelfId: number, bookId: number): Promise<void> => {
        await apiClient.post(`/shelves/${shelfId}/books`, { bookId });
    },

    removeBookFromShelf: async (shelfId: number, bookId: number): Promise<void> => {
        await apiClient.delete(`/shelves/${shelfId}/books/${bookId}`);
    }
};
