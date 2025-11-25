import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface UpdateProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
    onProgressUpdated: () => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({ isOpen, onClose, book, onProgressUpdated }) => {
    const [status, setStatus] = useState<string>('plan_to_read');
    const [progress, setProgress] = useState<number>(0);
    const [rating, setRating] = useState<number>(0);

    useEffect(() => {
        if (book) {
            setStatus(book.user_status || 'plan_to_read');
            setProgress(book.user_progress || 0);
            setRating(book.user_rating || 0);
        }
    }, [book]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book) return;

        try {
            await bookService.updateProgress(book.id, status, progress, rating);
            onProgressUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Reading Progress">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="plan_to_read">Plan to Read</option>
                        <option value="reading">Currently Reading</option>
                        <option value="read">Read</option>
                        <option value="dropped">Dropped</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Progress {book?.page_count ? `(Pages / ${book.page_count})` : '(Pages)'}</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="0"
                            max={book?.page_count || undefined}
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                            style={{ flex: 1 }}
                        />
                        {book?.page_count && (
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {Math.round((progress / book.page_count) * 100)}%
                            </span>
                        )}
                    </div>
                    {/* Visual Progress Bar Slider */}
                     <input
                        type="range"
                        min="0"
                        max={book?.page_count || 100}
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '10px' }}
                    />
                </div>

                <div className="form-group">
                    <label>Your Rating</label>
                    <div style={{ fontSize: '1.5rem', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => setRating(star)}
                                style={{ color: star <= rating ? 'gold' : 'var(--text-secondary)' }}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="primary-btn" style={{ flex: 1 }}>Update</button>
                </div>
            </form>
        </Modal>
    );
};
