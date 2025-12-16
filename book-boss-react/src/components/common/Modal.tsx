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
                    <button className="close-modal-btn" onClick={onClose}>
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
