import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface MetadataRefreshModalProps {
    isOpen: boolean;
    onClose: () => void;
    book?: Book;
    onRefreshComplete?: () => void;
}

/**
 * MetadataRefreshModal Component
 * Allows users to refresh book metadata from external sources
 * Supports single book or batch refresh
 */
export const MetadataRefreshModal: React.FC<MetadataRefreshModalProps> = ({
    isOpen,
    onClose,
    book,
    onRefreshComplete
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState<string>('');
    const [refreshResult, setRefreshResult] = useState<any>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setRefreshStatus('Fetching metadata from OpenLibrary...');

        try {
            const result = await bookService.refreshMetadata();
            setRefreshResult(result);
            setRefreshStatus(result.message || 'Metadata refresh completed');

            if (onRefreshComplete) {
                setTimeout(() => {
                    onRefreshComplete();
                }, 1500);
            }
        } catch (error: any) {
            console.error('Error refreshing metadata:', error);
            setRefreshStatus(error.response?.data?.error || 'Failed to refresh metadata');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleClose = () => {
        setRefreshStatus('');
        setRefreshResult(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="🔄 Refresh Metadata">
            <div style={{ minWidth: '400px' }}>
                {book ? (
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
                            {book.title}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            by {book.author}
                        </p>
                        {book.isbn && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '5px' }}>
                                ISBN: {book.isbn}
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Refresh metadata for all books in your library from OpenLibrary.
                        </p>
                    </div>
                )}

                <div style={{
                    padding: '15px',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
                        What will be updated:
                    </h4>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.8'
                    }}>
                        <li>Cover images</li>
                        <li>Publication dates</li>
                        <li>Page counts</li>
                        <li>Publishers</li>
                        <li>Descriptions</li>
                        <li>Series information</li>
                    </ul>
                </div>

                {refreshStatus && (
                    <div style={{
                        padding: '15px',
                        background: refreshResult?.success
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${refreshResult?.success ? '#10b981' : '#ef4444'}`,
                        borderRadius: '8px',
                        marginBottom: '20px',
                        color: refreshResult?.success ? '#10b981' : '#ef4444'
                    }}>
                        {refreshStatus}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="primary-btn"
                        style={{ flex: 1 }}
                    >
                        {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Metadata'}
                    </button>
                    <button
                        onClick={handleClose}
                        className="secondary-btn"
                        style={{ flex: 1 }}
                    >
                        {refreshResult ? 'Done' : 'Cancel'}
                    </button>
                </div>

                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                }}>
                    <strong>💡 Tip:</strong> Metadata is fetched from OpenLibrary API. Books with ISBNs will have the most accurate results.
                </div>
            </div>
        </Modal>
    );
};
