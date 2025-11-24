import React, { useState } from 'react';
import { type Book } from '../../types/book';

interface BookCardProps {
    book: Book;
    onClick?: () => void;
    onEdit?: (book: Book) => void;
    onDelete?: (book: Book) => void;
    bulkMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (bookId: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete, bulkMode = false, isSelected = false, onToggleSelection }) => {
    const [showMenu, setShowMenu] = useState(false);

    const coverUrl = book.cover_image_path
        ? `http://localhost:3000/${book.cover_image_path}`
        : book.cover_url
            ? book.cover_url.startsWith('http')
                ? book.cover_url
                : `http://localhost:3000${book.cover_url}`
            : '/no_cover.png';

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
            <div className="book-info">
                <div className="book-title" title={book.title}>
                    {book.title}
                </div>
                <div className="book-author" title={book.author}>
                    {book.author}
                </div>
                <div className="book-badges">
                    {book.format && <span className="badge badge-format">{book.format}</span>}
                    {book.status && <span className={`badge badge-status ${book.status.toLowerCase().replace(' ', '-')}`}>{book.status}</span>}
                    {book.is_loaned && <span className="badge badge-loaned">Loaned to {book.borrower_name}</span>}
                </div>
            </div>

            {showMenu && (
                <div className="context-menu" onClick={(e) => e.stopPropagation()}>
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
