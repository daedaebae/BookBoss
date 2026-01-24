import React, { type ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '600px', className = '' }) => {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${className}`} onClick={onClose}>
            <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth }}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button
                        className="close-modal-btn"
                        onClick={onClose}
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            padding: '4px 12px',
                            background: 'var(--card-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            width: '36px',
                            height: '36px',
                            marginLeft: 'auto'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--card-bg)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};
