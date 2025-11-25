import apiClient from './api';
import { type Book } from '../types/book';

export const bookService = {
    // Get all books
    getBooks: async (): Promise<Book[]> => {
        const response = await apiClient.get<Book[]>('/books');
        return response.data;
    },

    // Get single book
    getBook: async (id: number): Promise<Book> => {
        const response = await apiClient.get<Book>(`/books/${id}`);
        return response.data;
    },

    // Add new book
    addBook: async (bookData: Partial<Book>): Promise<Book> => {
        const response = await apiClient.post<Book>('/books', bookData);
        return response.data;
    },

    // Update book
    updateBook: async (id: number, bookData: Partial<Book>): Promise<Book> => {
        const response = await apiClient.put<Book>(`/books/${id}`, bookData);
        return response.data;
    },

    // Delete book
    deleteBook: async (id: number): Promise<void> => {
        await apiClient.delete(`/books/${id}`);
    },

    // Bulk delete books
    bulkDeleteBooks: async (ids: number[]): Promise<void> => {
        await apiClient.delete('/books/bulk', { data: { ids } });
    },

    // Bulk update books
    bulkUpdateBooks: async (ids: number[], updates: Partial<Book>): Promise<void> => {
        await apiClient.patch('/books/bulk', { ids, updates });
    },
};
