import React from 'react';
import { Modal } from '../common/Modal';

interface MetadataDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    changes: Record<string, { old: any; new: any }>;
}

export const MetadataDiffModal: React.FC<MetadataDiffModalProps> = ({ isOpen, onClose, changes }) => {
    const fieldNames = Object.keys(changes);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Metadata Updates Found!" maxWidth="600px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    We found updated information for your book. Here is what changed:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {fieldNames.map(field => {
                        const change = changes[field];
                        return (
                            <div key={field} style={{
                                padding: '15px',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-color)' }}>{field}</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Previous</div>
                                        <div style={{ wordBreak: 'break-word', opacity: 0.8 }}>
                                            {change.old ? String(change.old).slice(0, 100) + (String(change.old).length > 100 ? '...' : '') : '(Empty)'}
                                        </div>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>New</div>
                                        <div style={{ wordBreak: 'break-word', fontWeight: 'bold' }}>
                                            {change.new ? String(change.new).slice(0, 100) + (String(change.new).length > 100 ? '...' : '') : '(Empty)'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Your library has been updated automatically.
                </div>

                <button className="primary-btn" onClick={onClose} style={{ alignSelf: 'center', minWidth: '120px' }}>
                    Awesome!
                </button>
            </div>
        </Modal>
    );
};
