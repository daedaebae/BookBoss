import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Toast } from '../common/Toast';
import { type BookPhoto } from '../../types/book';
import { photoService } from '../../services/photoService';
import { PhotoUpload } from './PhotoUpload';

interface PhotoGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: number;
    bookTitle: string;
    coverUrl?: string;
}

/**
 * Modal component for viewing and managing book photos
 * Includes photo gallery, upload, and photo management features
 */
export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
    isOpen,
    onClose,
    bookId,
    bookTitle,
    coverUrl
}) => {
    const [photos, setPhotos] = useState<BookPhoto[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<BookPhoto | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isDanger });
    };

    useEffect(() => {
        if (isOpen) {
            loadPhotos();
        }
    }, [isOpen, bookId]);

    const loadPhotos = async () => {
        setIsLoading(true);
        try {
            const data = await photoService.getBookPhotos(bookId);
            setPhotos(data);
        } catch (error) {
            console.error('Error loading photos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayedPhotos = () => {
        const displayPhotos = [...photos];
        if (coverUrl) {
            // Create a pseudo-photo for the cover
            const coverPhoto: BookPhoto = {
                id: -1, // Use negative ID for the main cover
                book_id: bookId,
                photo_path: coverUrl,
                photo_type: 'cover',
                description: 'Main Book Cover',
                uploaded_at: new Date().toISOString()
            };
            displayPhotos.unshift(coverPhoto);
        }
        return displayPhotos;
    };

    const displayedPhotos = getDisplayedPhotos();

    const handlePhotoUploaded = () => {
        loadPhotos();
        setShowUpload(false);
    };

    const handleDeletePhoto = async (photoId: number) => {
        openConfirm(
            'Delete Photo',
            'Are you sure you want to delete this photo?',
            async () => {
                try {
                    await photoService.deletePhoto(photoId);
                    loadPhotos();
                    setSelectedPhoto(null);
                    showToast('Photo deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting photo:', error);
                    showToast('Failed to delete photo', 'error');
                }
            },
            true
        );
    };

    const getPhotoTypeIcon = (type?: string) => {
        switch (type) {
            case 'cover': return '📕';
            case 'spine': return '📚';
            case 'edges': return '✨';
            case 'special': return '⭐';
            default: return '📷';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`📸 Photos - ${bookTitle}`}>
            <div style={{ minHeight: '400px' }}>
                {/* Header with Upload Button */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        {displayedPhotos.length} {displayedPhotos.length === 1 ? 'Photo' : 'Photos'}
                    </h3>
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="primary-btn small"
                    >
                        {showUpload ? '📋 View Gallery' : '➕ Add Photo'}
                    </button>
                </div>

                {/* Upload Section */}
                {showUpload && (
                    <PhotoUpload bookId={bookId} onPhotoUploaded={handlePhotoUploaded} />
                )}

                {/* Gallery Grid */}
                {!showUpload && (
                    <>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                Loading photos...
                            </div>
                        ) : displayedPhotos.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📷</div>
                                <p>No photos yet</p>
                                <p style={{ fontSize: '0.9rem' }}>Click "Add Photo" to upload your first photo</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '15px',
                                marginBottom: '20px'
                            }}>
                                {displayedPhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        onClick={() => setSelectedPhoto(photo)}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            background: 'var(--card-bg)',
                                            border: selectedPhoto?.id === photo.id ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                            transition: 'transform 0.2s, border-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <img
                                            src={photo.photo_path.startsWith('http') ? photo.photo_path : `http://localhost:3000${photo.photo_path}`}
                                            alt={photo.description || 'Book photo'}
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {photo.photo_type && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                background: 'rgba(0, 0, 0, 0.7)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '1.2rem'
                                            }}>
                                                {getPhotoTypeIcon(photo.photo_type)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Photo Details */}
                        {selectedPhoto && (
                            <div style={{
                                marginTop: '20px',
                                padding: '20px',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                        {getPhotoTypeIcon(selectedPhoto.photo_type)} Photo Details
                                    </h4>

                                    {selectedPhoto.id !== -1 && (
                                        <button
                                            onClick={() => handleDeletePhoto(selectedPhoto.id)}
                                            className="secondary-btn small"
                                            style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    )}
                                </div>

                                <img
                                    src={selectedPhoto.photo_path.startsWith('http') ? selectedPhoto.photo_path : `http://localhost:3000${selectedPhoto.photo_path}`}
                                    alt={selectedPhoto.description || 'Book photo'}
                                    style={{
                                        width: '100%',
                                        maxHeight: '400px',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        marginBottom: '15px'
                                    }}
                                />

                                {selectedPhoto.photo_type && (
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        <strong>Type:</strong> {selectedPhoto.photo_type}
                                    </p>
                                )}

                                {selectedPhoto.description && (
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        <strong>Description:</strong> {selectedPhoto.description}
                                    </p>
                                )}

                                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <strong style={{ color: 'var(--text-secondary)' }}>Tags:</strong>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {selectedPhoto.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        padding: '4px 12px',
                                                        background: 'var(--accent-color)',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        color: 'white'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '15px' }}>
                                    Uploaded: {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </>
                )
                }
            </div >


            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
            />
        </Modal >
    );
};
