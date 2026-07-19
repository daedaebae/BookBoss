import React, { type ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    className?: string;
    disableOverlayClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '600px', className = '', disableOverlayClose = false }) => {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${className}`} onClick={disableOverlayClose ? undefined : onClose}>
            <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth }}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button
                        type="button"
                        className="close-modal-btn"
                        onClick={onClose}
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
