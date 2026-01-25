import React from 'react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDanger = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="confirmation-content">
                <p style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{message}</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        className="secondary-btn"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={isDanger ? "danger-btn" : "primary-btn"}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        style={isDanger ? { backgroundColor: 'var(--danger-color)', color: 'white', border: 'none' } : {}}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
