import apiClient from './api';
import { type BookPhoto } from '../types/book';

/**
 * Service for managing book photos
 * Handles photo uploads, retrieval, and deletion
 */
export const photoService = {
    /**
     * Get all photos for a specific book
     * @param bookId - The ID of the book
     * @returns Array of BookPhoto objects
     */
    getBookPhotos: async (bookId: number): Promise<BookPhoto[]> => {
        const response = await apiClient.get<BookPhoto[]>(`/books/${bookId}/photos`);
        return response.data;
    },

    /**
     * Upload a new photo for a book
     * @param bookId - The ID of the book
     * @param file - The image file to upload
     * @param photoType - Type of photo (cover, spine, edges, special)
     * @param description - Optional description
     * @param tags - Optional array of tags
     * @returns The created BookPhoto object
     */
    uploadPhoto: async (
        bookId: number,
        file: File,
        photoType?: string,
        description?: string,
        tags?: string[]
    ): Promise<BookPhoto> => {
        const formData = new FormData();
        formData.append('photo', file);
        if (photoType) formData.append('photo_type', photoType);
        if (description) formData.append('description', description);
        if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));

        const response = await apiClient.post<BookPhoto>(
            `/books/${bookId}/photos`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Delete a photo
     * @param photoId - The ID of the photo to delete
     */
    deletePhoto: async (photoId: number): Promise<void> => {
        await apiClient.delete(`/photos/${photoId}`);
    },

    /**
     * Update photo metadata
     * @param photoId - The ID of the photo
     * @param updates - Object containing fields to update
     */
    updatePhoto: async (
        photoId: number,
        updates: {
            photo_type?: string;
            description?: string;
            tags?: string[];
        }
    ): Promise<BookPhoto> => {
        const response = await apiClient.put<BookPhoto>(`/photos/${photoId}`, updates);
        return response.data;
    },
};
