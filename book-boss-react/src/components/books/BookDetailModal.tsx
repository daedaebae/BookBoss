import React from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { getSafeCoverUrl } from '../../utils/coverUrlGuard';

interface BookDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
    onRead: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
    isOpen,
    onClose,
    book,
    onEdit,
    onDelete,
    onRead
}) => {
    if (!book) return null;

    const coverUrl = getSafeCoverUrl(book);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book Details">
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                {/* Left Column: Large Cover Image */}
                <div style={{ flex: '0 0 300px' }}>
                    <img
                        src={coverUrl}
                        alt={book.title}
                        style={{
                            width: '100%',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            objectFit: 'cover',
                            aspectRatio: '2/3'
                        }}
                        onError={(e) => {
                            e.currentTarget.src = '/no_cover.png';
                        }}
                    />
                </div>

                {/* Right Column: Details & Actions */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{book.title}</h2>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{book.author}</h3>

                        {book.series && (
                            <div style={{ marginTop: '8px', color: 'var(--accent-color)', fontWeight: 500 }}>
                                {book.series} {book.series_order ? `#${book.series_order}` : ''}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {book.rating && (
                            <span className="badge" style={{ background: 'var(--glass-background)', border: '1px solid var(--glass-border)' }}>
                                ⭐ {book.rating}
                            </span>
                        )}
                        {book.status && (
                            <span className={`badge badge-status ${book.status.toLowerCase().replace(' ', '-')}`}>
                                {book.status}
                            </span>
                        )}
                        {book.format && <span className="badge badge-format">{book.format}</span>}
                        {book.page_count && <span className="badge">📄 {book.page_count} pages</span>}
                    </div>

                    {/* Progress Bar if In Progress */}
                    {book.status === 'In Progress' && (
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${book.progress_percentage || (book.current_page && book.page_count ? (book.current_page / book.page_count * 100) : 0)}%`,
                                background: `linear-gradient(90deg, 
                                    ${(book.progress_percentage || 0) < 50 ? '#fbbf24' :
                                        (book.progress_percentage || 0) < 80 ? '#f97316' : '#10b981'})`
                            }} />
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        {book.isbn && (
                            <>
                                <strong>ISBN:</strong> <span>{book.isbn}</span>
                            </>
                        )}
                        {book.publication_date && (
                            <>
                                <strong>Published:</strong> <span>{new Date(book.publication_date).toLocaleDateString()}</span>
                            </>
                        )}
                        {book.added_at && (
                            <>
                                <strong>Added:</strong> <span>{new Date(book.added_at).toLocaleDateString()}</span>
                            </>
                        )}
                        {book.library && (
                            <>
                                <strong>Library:</strong> <span>{book.library}</span>
                            </>
                        )}
                        {book.shelf && (
                            <>
                                <strong>Shelf:</strong> <span>{book.shelf}</span>
                            </>
                        )}
                    </div>

                    {/* Loan Info */}
                    {book.is_loaned && (
                        <div style={{
                            padding: '15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--accent-color)'
                        }}>
                            <strong>Loaned to:</strong> {book.borrower_name}
                            {book.due_date && (
                                <div style={{ marginTop: '5px' }}>
                                    <strong>Due:</strong> {new Date(book.due_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '15px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        {(book.format === 'Ebook' || book.epub_file_path) && (
                            <button
                                className="primary-btn"
                                onClick={() => onRead(book)}
                                style={{ flex: 1 }}
                            >
                                📖 Read Book
                            </button>
                        )}

                        <button
                            className="secondary-btn"
                            onClick={() => onEdit(book)}
                            style={{ flex: 1 }}
                        >
                            ✏️ Edit
                        </button>

                        <button
                            className="danger-btn"
                            onClick={() => onDelete(book)}
                            style={{ flex: 1 }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
