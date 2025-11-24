import React, { useState } from 'react';
import { type Book } from '../../types/book';

interface BookCardProps {
    book: Book;
    onClick?: () => void;
    onEdit?: (book: Book) => void;
    onDelete?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const coverUrl = book.cover_url
        ? `http://localhost:3000${book.cover_url}`
        : 'https://via.placeholder.com/140x210?text=No+Cover';

    const handleCardClick = (e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.context-menu')) {
            setShowMenu(!showMenu);
            onClick?.();
        }
    };

    return (
        <div className={`book-card ${showMenu ? 'active' : ''}`} onClick={handleCardClick}>
            <img
                src={coverUrl}
                alt={book.title}
                className="book-cover"
                onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/140x210?text=No+Cover';
                }}
            />
            <div className="book-info">
                <div className="book-title" title={book.title}>
                    {book.title}
                </div>
                <div className="book-author" title={book.author}>
                    {book.author}
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
