import api from './api';

export interface AbsSearchResult {
    id: string;
    name: string; // or title depending on ABS version, we mapped it in backend to be consistent?
    // Actually backend returns whatever ABS returns plus _server and _library
    media: {
        metadata: {
            title: string;
            authorName?: string;
            authors?: Array<{ name: string }>;
            description?: string;
            publishedYear?: string;
            publisher?: string;
            language?: string;
            series?: Array<{ name: string }>;
        };
        duration: number;
        coverPath?: string;
    };
    _server: {
        id: number;
        name: string;
        url: string;
    };
    _library: {
        id: string;
        name: string;
    };
}

export const absService = {
    // Search for books across all connected ABS servers
    search: async (query: string): Promise<AbsSearchResult[]> => {
        const response = await api.get(`/audiobookshelf/search?q=${encodeURIComponent(query)}`);
        return response.data.results;
    },

    // Import a book from ABS
    importBook: async (absItem: AbsSearchResult) => {
        const payload = {
            absItem,
            serverId: absItem._server.id,
            libraryId: absItem._library.id
        };
        const response = await api.post('/books/import/abs', payload);
        return response.data;
    },

    // Link an existing book to an ABS item
    linkBook: async (bookId: number, absItem: AbsSearchResult) => {
        const payload = {
            serverId: absItem._server.id,
            libraryItemId: absItem.id,
            libraryId: absItem._library.id
        };
        const response = await api.post(`/books/${bookId}/link/abs`, payload);
        return response.data;
    },

    // Unlink a book
    unlinkBook: async (bookId: number) => {
        const response = await api.delete(`/books/${bookId}/link/abs`);
        return response.data;
    },

    // Sync library
    syncLibrary: async (serverId: number, libraryId: string, debug: boolean = false) => {
        const response = await api.post('/audiobookshelf/sync', { serverId, libraryId, debug });
        return response.data;
    },
};
