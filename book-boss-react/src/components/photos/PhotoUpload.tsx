import React, { useState } from 'react';
import { photoService } from '../../services/photoService';

interface PhotoUploadProps {
    bookId: number;
    onPhotoUploaded: () => void;
}

/**
 * Component for uploading photos to a book
 * Supports drag-and-drop and file selection
 */
export const PhotoUpload: React.FC<PhotoUploadProps> = ({ bookId, onPhotoUploaded }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoType, setPhotoType] = useState<string>('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a photo first');
            return;
        }

        setIsUploading(true);
        try {
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
            await photoService.uploadPhoto(
                bookId,
                selectedFile,
                photoType || undefined,
                description || undefined,
                tagArray.length > 0 ? tagArray : undefined
            );

            // Reset form
            setSelectedFile(null);
            setPreview(null);
            setPhotoType('');
            setDescription('');
            setTags('');

            onPhotoUploaded();
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Drag and Drop Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(139, 92, 246, 0.1)' : 'var(--glass-bg)',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    transition: 'all 0.3s'
                }}
                onClick={() => document.getElementById('photo-file-input')?.click()}
            >
                {preview ? (
                    <div>
                        <img
                            src={preview}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '8px',
                                marginBottom: '10px'
                            }}
                        />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {selectedFile?.name}
                        </p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📸</div>
                        <p style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>
                            Drag and drop an image here
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            or click to select a file
                        </p>
                    </div>
                )}
                <input
                    id="photo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                />
            </div>

            {selectedFile && (
                <>
                    {/* Photo Type */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Photo Type</label>
                        <select
                            value={photoType}
                            onChange={(e) => setPhotoType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="">Select type (optional)</option>
                            <option value="cover">Cover</option>
                            <option value="spine">Spine</option>
                            <option value="edges">Edges</option>
                            <option value="special">Special Features</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Tags</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Comma-separated tags (e.g., gilded, signed, first edition)"
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Separate multiple tags with commas
                        </small>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="primary-btn"
                        style={{ width: '100%' }}
                    >
                        {isUploading ? 'Uploading...' : '📤 Upload Photo'}
                    </button>
                </>
            )}
        </div>
    );
};
