import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface EditBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
    onBookUpdated: () => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({ isOpen, onClose, book, onBookUpdated }) => {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        library: '',
    });

    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title,
                author: book.author,
                isbn: book.isbn || '',
                library: book.library || '',
            });
        }
    }, [book]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book) return;

        try {
            await bookService.updateBook(book.id, formData);
            onBookUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating book:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Book">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title *</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Author *</label>
                    <input
                        type="text"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>ISBN</label>
                    <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Library</label>
                    <input
                        type="text"
                        value={formData.library}
                        onChange={(e) => setFormData({ ...formData, library: e.target.value })}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="secondary-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-btn" style={{ flex: 1 }}>
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};
