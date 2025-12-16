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
        // Since we don't have a dedicated single book endpoint in server.js yet (it relies on list filtering or specific impl),
        // we might just filter from getBooks or assume there is one.
        // Note: server.js shows `app.get('/api/books')` returns all.
        // We might need to implement `app.get('/api/books/:id')` or filter client side.
        // For now, let's assume the API might support it or we filter.
        // Actually, looking at server.js, there isn't a specific /books/:id GET route!
        // But for migration, we'll keep this signature.
        const response = await apiClient.get<Book[]>(`/books`);
        const book = response.data.find(b => b.id === Number(id));
        if (!book) throw new Error('Book not found');
        return book;
    },

    // Add new book (FormData support for file uploads)
    addBook: async (formData: FormData): Promise<Book> => {
        const response = await apiClient.post<Book>('/books', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update book (FormData support)
    // Update book (JSON)
    updateBook: async (id: number, data: Partial<Book> | FormData): Promise<Book> => {
        // Check if data is FormData or plain object
        const isFormData = data instanceof FormData;

        const response = await apiClient.put<Book>(`/books/${id}`, data, {
            headers: isFormData ? {
                'Content-Type': 'multipart/form-data',
            } : {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    // Delete book
    deleteBook: async (id: number): Promise<void> => {
        await apiClient.delete(`/books/${id}`);
    },

    // Bulk delete books
    bulkDeleteBooks: async (ids: number[]): Promise<void> => {
        await apiClient.post('/books/bulk-delete', { ids });
    },

    // Refresh Metadata
    refreshMetadata: async (): Promise<{ success: boolean, message: string }> => {
        const response = await apiClient.post('/books/refresh-metadata');
        return response.data;
    },

    // Update Reading Progress
    updateProgress: async (bookId: number, status: string, progress: number, rating: number): Promise<void> => {
        await apiClient.post(`/user/books/${bookId}`, { status, progress, rating });
    },

    // Get User Reading Progress
    getUserBooks: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>('/user/books');
        return response.data;
    }
};
