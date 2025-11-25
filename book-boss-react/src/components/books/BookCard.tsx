import React, { useState } from 'react';
import { type Book } from '../../types/book';
import { type Shelf } from '../../types/shelf';

interface BookCardProps {
    book: Book;
    shelves?: Shelf[];
    onClick?: () => void;
    onEdit?: (book: Book) => void;
    onDelete?: (book: Book) => void;
    onRead?: (book: Book) => void;
    onAddToShelf?: (bookId: number, shelfId: number) => void;
    onUpdateProgress?: (book: Book) => void;
    bulkMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (bookId: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
    book, shelves = [], onEdit, onDelete, onRead, onAddToShelf, onUpdateProgress,
    bulkMode = false, isSelected = false, onToggleSelection
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showShelfSubmenu, setShowShelfSubmenu] = useState(false);

    const coverUrl = book.cover_image_path
        ? `http://localhost:3000/${book.cover_image_path}`
        : book.cover_url
            ? book.cover_url.startsWith('http')
                ? book.cover_url
                : `http://localhost:3000${book.cover_url}`
            : '/no_cover.png';

    // Progress Bar Calculation
    const progressPercent = book.page_count && book.user_progress
        ? Math.min(100, Math.round((book.user_progress / book.page_count) * 100))
        : 0;

    const displayStatus = book.user_status || book.status;

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
                {book.series && (
                    <div className="book-series" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {book.series} {book.series_index ? `#${book.series_index}` : ''}
                    </div>
                )}
                <div className="book-badges">
                    {book.format && <span className="badge badge-format">{book.format}</span>}
                    {displayStatus && <span className={`badge badge-status ${displayStatus.toLowerCase().replace(' ', '-').replace('_', '-')}`}>
                        {displayStatus.replace(/_/g, ' ')}
                    </span>}
                    {book.is_loaned && <span className="badge badge-loaned">Loaned to {book.borrower_name}</span>}
                </div>

                {/* Progress Bar */}
                {progressPercent > 0 && (
                    <div className="book-progress-bar" title={`${progressPercent}% Read`}>
                        <div
                            className="book-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                )}
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

                    {onUpdateProgress && (
                        <button
                            className="context-btn"
                            onClick={() => {
                                onUpdateProgress(book);
                                setShowMenu(false);
                            }}
                        >
                            📊 Progress
                        </button>
                    )}

                    {/* Add to Shelf Submenu Trigger */}
                    {shelves.length > 0 && onAddToShelf && (
                        <div style={{ position: 'relative' }}>
                            <button
                                className="context-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowShelfSubmenu(!showShelfSubmenu);
                                }}
                            >
                                📚 Add to Shelf {showShelfSubmenu ? '▼' : '▶'}
                            </button>
                            {showShelfSubmenu && (
                                <div className="submenu" style={{
                                    position: 'absolute',
                                    left: '100%',
                                    top: 0,
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    minWidth: '150px',
                                    zIndex: 101,
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {shelves.map(shelf => (
                                        <button
                                            key={shelf.id}
                                            className="context-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddToShelf(book.id, shelf.id);
                                                setShowMenu(false);
                                            }}
                                            disabled={book.shelf_ids?.includes(shelf.id)}
                                            style={{ opacity: book.shelf_ids?.includes(shelf.id) ? 0.5 : 1 }}
                                        >
                                            {book.shelf_ids?.includes(shelf.id) ? '✓ ' : ''}{shelf.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
