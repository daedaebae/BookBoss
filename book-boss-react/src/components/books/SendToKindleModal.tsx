import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Toast } from '../common/Toast';
import { type Book } from '../../types/book';

interface SendToKindleModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
}

export const SendToKindleModal: React.FC<SendToKindleModalProps> = ({ isOpen, onClose, book }) => {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    useEffect(() => {
        if (isOpen) {
            const savedEmail = localStorage.getItem('bookboss_kindle_email');
            if (savedEmail) {
                setEmail(savedEmail);
            }
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!email) {
            showToast('Please enter an email address', 'error');
            return;
        }

        if (!book) return;

        localStorage.setItem('bookboss_kindle_email', email);
        setIsSending(true);

        try {
            const token = localStorage.getItem('bookboss_token');
            const res = await fetch(`/api/email/send/${book.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ to: email })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send ebook');
            }

            showToast('Ebook sent successfully!', 'success');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error: any) {
            console.error('Send to device error:', error);
            showToast(error.message || 'Failed to send to device', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (!book) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send to Device">
            <div style={{ padding: '10px 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Send <strong>{book.title}</strong> directly to your e-reader's email address (e.g., your @kindle.com address).
                </p>

                <div className="form-group">
                    <label>E-Reader Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@kindle.com"
                        className="form-input"
                        style={{ width: '100%' }}
                        autoFocus
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
                    <button className="secondary-btn" onClick={onClose} disabled={isSending}>
                        Cancel
                    </button>
                    <button
                        className="primary-btn"
                        onClick={handleSend}
                        disabled={isSending || !email}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSending ? <><span className="spinner-small" /> Sending...</> : '📨 Send Now'}
                    </button>
                </div>
            </div>

            <Toast {...toast} onClose={() => setToast({ ...toast, isVisible: false })} />
        </Modal>
    );
};
