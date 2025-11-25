import apiClient from './api';

export const exportService = {
    // Export Library as CSV
    exportCSV: async () => {
        const response = await apiClient.get('/export/csv', {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `library_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Export Library as JSON
    exportJSON: async () => {
        const response = await apiClient.get('/export/json', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `library_export_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Create Database Backup
    createBackup: async () => {
        const response = await apiClient.get('/backup', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bookboss_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Restore Database from Backup
    restoreBackup: async (file: File) => {
        const formData = new FormData();
        formData.append('backupFile', file);

        const response = await apiClient.post('/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }
};
