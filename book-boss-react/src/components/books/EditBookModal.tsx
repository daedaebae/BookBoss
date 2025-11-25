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
    const [formData, setFormData] = useState<Partial<Book>>({
        title: '',
        author: '',
        isbn: '',
        library: '',
        format: '',
        series: '',
        series_index: undefined,
        publisher: '',
        language: '',
        description: '',
        shelf: '',
        status: undefined,
        is_loaned: false,
        borrower_name: '',
        loan_date: '',
        due_date: '',
        // Enhanced physical book metadata
        physical_format: undefined,
        book_condition: undefined,
        is_signed: false,
        has_bonus_chapters: false,
        edition_type: '',
        edge_type: undefined,
        binding_details: '',
    });

    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title,
                author: book.author,
                isbn: book.isbn || '',
                library: book.library || '',
                format: book.format || '',
                series: book.series || '',
                series_order: book.series_order,
                series_index: book.series_index,
                publisher: book.publisher || '',
                language: book.language || 'en',
                description: book.description || '',
                shelf: book.shelf || '',
                status: book.status,
                rating: book.rating,
                page_count: book.page_count,
                publication_date: book.publication_date,
                is_loaned: book.is_loaned || false,
                borrower_name: book.borrower_name || '',
                loan_date: book.loan_date || '',
                due_date: book.due_date || '',
                current_page: book.current_page || 0,
                progress_percentage: book.progress_percentage || 0,
                last_read_at: book.last_read_at,
                // Enhanced physical book metadata
                physical_format: book.physical_format,
                book_condition: book.book_condition,
                is_signed: book.is_signed || false,
                has_bonus_chapters: book.has_bonus_chapters || false,
                edition_type: book.edition_type || '',
                edge_type: book.edge_type,
                binding_details: book.binding_details || '',
            });
        }
    }, [book]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book) return;

        try {
            // Use FormData for update
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    data.append(key, value.toString());
                }
            });

            await bookService.updateBook(book.id, data);
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
                <div className="form-group">
                    <label>Format</label>
                    <select
                        value={formData.format || ''}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    >
                        <option value="">Select format</option>
                        <option value="Physical">Physical</option>
                        <option value="Ebook">Ebook</option>
                        <option value="Audiobook">Audiobook</option>
                    </select>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 2 }}>
                        <label>Series</label>
                        <input
                            type="text"
                            value={formData.series || ''}
                            onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Index</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.series_index || ''}
                            onChange={(e) => setFormData({ ...formData, series_index: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Publisher</label>
                    <input
                        type="text"
                        value={formData.publisher || ''}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Language</label>
                    <input
                        type="text"
                        value={formData.language || ''}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    />
                </div>

                {/* Series Order - Only show when series is filled */}
                {formData.series && (
                    <div className="form-group">
                        <label>Series Order (Book #)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.series_order || ''}
                            onChange={(e) => setFormData({ ...formData, series_order: parseInt(e.target.value) || undefined })}
                            placeholder="e.g., 3"
                        />
                    </div>
                )}
                <div className="form-group">
                    <label>Shelf</label>
                    <input
                        type="text"
                        value={formData.shelf || ''}
                        onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                        <option value="">Select status</option>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="DNF">DNF</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Rating (0-5)</label>
                    <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={formData.rating || ''}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    />
                </div>
                <div className="form-group">
                    <label>Page Count</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.page_count || ''}
                        onChange={(e) => setFormData({ ...formData, page_count: parseInt(e.target.value) })}
                    />
                </div>

                {/* Current Page - Only show for books in progress */}
                {formData.status === 'In Progress' && (
                    <div className="form-group">
                        <label>
                            Current Page
                            {formData.current_page && formData.page_count && (
                                <span style={{ marginLeft: '8px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                    ({Math.round((formData.current_page / formData.page_count) * 100)}%)
                                </span>
                            )}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={formData.page_count || undefined}
                            value={formData.current_page || ''}
                            onChange={(e) => {
                                const currentPage = parseInt(e.target.value) || 0;
                                const progressPercentage = formData.page_count
                                    ? (currentPage / formData.page_count) * 100
                                    : 0;
                                setFormData({
                                    ...formData,
                                    current_page: currentPage,
                                    progress_percentage: progressPercentage,
                                    last_read_at: new Date().toISOString()
                                });
                            }}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>Publication Date</label>
                    <input
                        type="date"
                        value={formData.publication_date ? new Date(formData.publication_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* Enhanced Physical Book Metadata Section */}
                <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        📚 Physical Book Details
                    </h3>
                    <div className="form-group">
                        <label>Physical Format</label>
                        <select
                            value={formData.physical_format || ''}
                            onChange={(e) => setFormData({ ...formData, physical_format: e.target.value as any })}
                        >
                            <option value="">Select format</option>
                            <option value="Hardback">Hardback</option>
                            <option value="Paperback">Paperback</option>
                            <option value="Mass Market Paperback">Mass Market Paperback</option>
                            <option value="Board Book">Board Book</option>
                            <option value="Leather Bound">Leather Bound</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Condition</label>
                        <select
                            value={formData.book_condition || ''}
                            onChange={(e) => setFormData({ ...formData, book_condition: e.target.value as any })}
                        >
                            <option value="">Select condition</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Edition Type</label>
                        <input
                            type="text"
                            value={formData.edition_type || ''}
                            onChange={(e) => setFormData({ ...formData, edition_type: e.target.value })}
                            placeholder="e.g., First Edition, Limited Edition"
                        />
                    </div>
                    <div className="form-group">
                        <label>Edge Type</label>
                        <select
                            value={formData.edge_type || ''}
                            onChange={(e) => setFormData({ ...formData, edge_type: e.target.value as any })}
                        >
                            <option value="">Select edge type</option>
                            <option value="Gilded">Gilded</option>
                            <option value="Fore-edge Painted">Fore-edge Painted</option>
                            <option value="Sprayed Edges">Sprayed Edges</option>
                            <option value="Hidden Fore-edge">Hidden Fore-edge</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_signed || false}
                                onChange={(e) => setFormData({ ...formData, is_signed: e.target.checked })}
                                style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            ✍️ Signed Copy
                        </label>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.has_bonus_chapters || false}
                                onChange={(e) => setFormData({ ...formData, has_bonus_chapters: e.target.checked })}
                                style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            📖 Bonus Chapters
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Binding Details</label>
                        <textarea
                            value={formData.binding_details || ''}
                            onChange={(e) => setFormData({ ...formData, binding_details: e.target.value })}
                            rows={2}
                            placeholder="Additional binding or decorative details..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Loan Tracking Section */}
                <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Loan Tracking
                    </h3>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_loaned || false}
                                onChange={(e) => setFormData({ ...formData, is_loaned: e.target.checked })}
                                style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            Book is currently loaned out
                        </label>
                    </div>
                    {formData.is_loaned && (
                        <>
                            <div className="form-group">
                                <label>Borrower Name</label>
                                <input
                                    type="text"
                                    value={formData.borrower_name || ''}
                                    onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                                    placeholder="Who borrowed this book?"
                                />
                            </div>
                            <div className="form-group">
                                <label>Loan Date</label>
                                <input
                                    type="date"
                                    value={formData.loan_date ? new Date(formData.loan_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                        </>
                    )}
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
