const axios = require('axios');

/**
 * Audiobookshelf API Client
 * Handles communication with Audiobookshelf servers for authentication,
 * library management, and playback synchronization.
 */
class AudiobookshelfClient {
    /**
     * Create a new ABS client instance
     * @param {string} serverUrl - The base URL of the ABS server
     * @param {string} apiToken - The user's API token
     */
    constructor(serverUrl, apiToken) {
        this.baseUrl = serverUrl.replace(/\/$/, '');
        this.apiToken = apiToken;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${apiToken} `
            }
        });
    }

    /**
     * Authenticate with an ABS server to get an API token
     * @param {string} serverUrl - The server URL
     * @param {string} username - The username
     * @param {string} password - The password
     * @returns {Promise<Object>} The login response containing the user and token
     */
    static async login(serverUrl, username, password) {
        const baseUrl = serverUrl.replace(/\/$/, '');
        try {
            const response = await axios.post(`${baseUrl}/login`, {
                username,
                password
            });
            return response.data;
        } catch (error) {
            console.error('ABS Login Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Libraries
    /**
     * Get all libraries accessible to the user
     * @returns {Promise<Array>} List of libraries
     */
    async getLibraries() {
        try {
            const response = await this.client.get('/api/libraries');
            return response.data.libraries;
        } catch (error) {
            console.error('ABS Get Libraries Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Get items within a specific library
     * @param {string} libraryId - The ID of the library
     * @param {Object} options - Query parameters (limit, page, sort, etc.)
     * @returns {Promise<Object>} The library items response
     */
    async getLibraryItems(libraryId, options = {}) {
        try {
            const response = await this.client.get(`/api/libraries/${libraryId}/items`, {
                params: options
            });
            return response.data;
        } catch (error) {
            console.error('ABS Get Library Items Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Get details for a specific library item
     * @param {string} itemId - The ID of the item
     * @param {boolean} expanded - Whether to return expanded details (default: true)
     * @returns {Promise<Object>} The item details
     */
    async getLibraryItem(itemId, expanded = true) {
        try {
            const response = await this.client.get(`/api/items/${itemId}`, {
                params: { expanded, include: 'progress,authors' }
            });
            return response.data;
        } catch (error) {
            console.error('ABS Get Library Item Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Start a playback session for an item
     * @param {string} libraryItemId - The ID of the item to play
     * @param {string|null} episodeId - Optional episode ID for podcasts
     * @returns {Promise<Object>} The session data
     */
    async startPlaybackSession(libraryItemId, episodeId = null) {
        try {
            const response = await this.client.post(`/api/items/${libraryItemId}/play`, {
                episodeId,
                deviceInfo: {
                    deviceId: 'bookboss-web',
                    clientName: 'BookBoss',
                    clientVersion: '1.0.0'
                }
            });
            return response.data;
        } catch (error) {
            console.error('ABS Start Playback Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Sync playback progress for an active session
     * @param {string} sessionId - The active session ID
     * @param {number} currentTime - Current playback time in seconds
     * @param {number} duration - Total duration in seconds
     * @param {number} progress - Progress percentage (0-1)
     * @returns {Promise<Object>} Sync response
     */
    async syncProgress(sessionId, currentTime, duration, progress) {
        try {
            // Note: ABS uses different endpoints for syncing progress depending on context
            // For an open session, we typically use the session sync endpoint
            // But for direct item updates, we use /api/me/progress/{itemId}

            // Here we'll assume we're syncing an open session if sessionId is provided
            if (sessionId) {
                const response = await this.client.post(`/api/sessions/${sessionId}/sync`, {
                    currentTime,
                    timeListened: 0, // Delta time listened, would need to track this
                    duration
                });
                return response.data;
            } else {
                // Fallback to item progress update if no session
                // This might need adjustment based on specific needs
                throw new Error('Session ID required for sync');
            }
        } catch (error) {
            console.error('ABS Sync Progress Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Update progress for a specific item without an active session
     * @param {string} libraryItemId - The item ID
     * @param {number} currentTime - Current time in seconds
     * @param {number} duration - Total duration in seconds
     * @param {number} progress - Progress percentage (0-1)
     * @param {boolean} isFinished - Whether the item is finished
     * @returns {Promise<Object>} Update response
     */
    async updateItemProgress(libraryItemId, currentTime, duration, progress, isFinished) {
        try {
            const response = await this.client.patch(`/api/me/progress/${libraryItemId}`, {
                currentTime,
                duration,
                progress,
                isFinished
            });
            return response.data;
        } catch (error) {
            console.error('ABS Update Item Progress Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Get current progress for a specific item
     * @param {string} libraryItemId - The item ID
     * @returns {Promise<Object>} Progress data
     */
    async getMediaProgress(libraryItemId) {
        try {
            const response = await this.client.get(`/api/me/progress/${libraryItemId}`);
            return response.data;
        } catch (error) {
            console.error('ABS Get Media Progress Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Search within a specific library
     * @param {string} libraryId - The library ID
     * @param {string} query - The search query
     * @returns {Promise<Object>} Search results
     */
    /**
     * Search within a specific library
     * @param {string} libraryId - The library ID
     * @param {string} query - The search query
     * @returns {Promise<Object>} Search results
     */
    async searchLibrary(libraryId, query) {
        try {
            const response = await this.client.get(`/api/libraries/${libraryId}/search`, {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.error('ABS Search Library Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Get the status of the connected server (validates token)
     * @returns {Promise<Object>} Server status and user info
     */
    async getServerStatus() {
        try {
            const response = await this.client.get('/api/me');
            return response.data;
        } catch (error) {
            console.error('ABS Get Server Status Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = AudiobookshelfClient;
