import React, { useState } from 'react';

interface FeatureFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => Promise<void>;
}

export const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(title, description);
            setTitle('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Submit Feature Request</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Dark Mode Support"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Describe your idea..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--text-primary)',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={isSubmitting || !title.trim()}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
