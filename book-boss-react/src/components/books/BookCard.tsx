import React, { useState } from 'react';
import { getSafeCoverUrl } from '../../utils/coverUrlGuard';
import { type Book } from '../../types/book';

interface BookCardProps {
    book: Book;
    onClick?: () => void;
    onEdit?: (book: Book) => void;
    onDelete?: (book: Book) => void;
    onRead?: (book: Book) => void;
    bulkMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (bookId: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete, onRead, bulkMode = false, isSelected = false, onToggleSelection }) => {
    const [showMenu, setShowMenu] = useState(false);

    const coverUrl = getSafeCoverUrl(book);

    return (
        <div
            className={`book-card ${showMenu ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
                if (bulkMode && onToggleSelection) {
                    e.stopPropagation();
                    onToggleSelection(book.id);
                } else {
                    setShowMenu(!showMenu);
                }
            }}
        >
            {bulkMode && (
                <div
                    className="book-checkbox"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection?.(book.id);
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection?.(book.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            <img
                src={coverUrl}
                alt={book.title}
                className="book-cover"
                onError={(e) => {
                    e.currentTarget.src = '/no_cover.png';
                }}
            />

            {/* Progress Bar for books in progress */}
            {book.status === 'In Progress' && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${book.progress_percentage || (book.current_page && book.page_count ? (book.current_page / book.page_count * 100) : 0)}%`,
                        background: `linear-gradient(90deg, 
                            ${(book.progress_percentage || 0) < 50 ? '#fbbf24' :
                                (book.progress_percentage || 0) < 80 ? '#f97316' : '#10b981'})`,
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            )}
            <div className="book-info">
                <div className="book-title" title={book.title}>
                    {book.title}
                </div>
                <div className="book-author" title={book.author}>
                    {book.author}
                </div>
                <div className="book-badges">
                    {book.series && (
                        <span className="badge badge-series" title={book.series}>
                            {book.series_order ? `Book ${book.series_order}` : book.series}
                        </span>
                    )}
                    {book.format && <span className="badge badge-format">{book.format}</span>}
                    {book.status && <span className={`badge badge-status ${book.status.toLowerCase().replace(' ', '-')}`}>{book.status}</span>}
                    {book.is_loaned && (() => {
                        const now = new Date();
                        const dueDate = book.due_date ? new Date(book.due_date) : null;
                        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

                        let badgeColor = 'var(--accent-color)'; // default blue
                        let badgeText = `Loaned to ${book.borrower_name}`;

                        if (daysUntilDue !== null) {
                            if (daysUntilDue < 0) {
                                badgeColor = 'var(--danger-color)'; // red for overdue
                                badgeText = `OVERDUE (${Math.abs(daysUntilDue)}d) - ${book.borrower_name}`;
                            } else if (daysUntilDue <= 2) {
                                badgeColor = '#f97316'; // orange
                                badgeText = `Due in ${daysUntilDue}d - ${book.borrower_name}`;
                            } else if (daysUntilDue <= 7) {
                                badgeColor = '#fbbf24'; // yellow
                                badgeText = `Due in ${daysUntilDue}d - ${book.borrower_name}`;
                            } else {
                                badgeColor = '#10b981'; // green
                                badgeText = `Loaned to ${book.borrower_name}`;
                            }
                        }

                        return (
                            <span
                                className="badge badge-loaned"
                                style={{ backgroundColor: badgeColor, color: 'white' }}
                                title={dueDate ? `Due: ${dueDate.toLocaleDateString()}` : 'No due date set'}
                            >
                                {badgeText}
                            </span>
                        );
                    })()}
                </div>
            </div>

            {showMenu && (
                <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                    {book.format === 'Ebook' && book.epub_file_path && onRead && (
                        <button
                            className="context-btn"
                            onClick={() => {
                                onRead(book);
                                setShowMenu(false);
                            }}
                        >
                            📖 Read
                        </button>
                    )}
                    <button
                        className="context-btn"
                        onClick={() => {
                            onEdit?.(book);
                            setShowMenu(false);
                        }}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        className="context-btn"
                        onClick={() => {
                            onDelete?.(book);
                            setShowMenu(false);
                        }}
                        style={{ color: 'var(--danger-color)' }}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}
        </div>
    );
};
