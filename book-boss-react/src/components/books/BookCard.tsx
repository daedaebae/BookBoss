import React from 'react';
import { getSafeCoverUrl } from '../../utils/coverUrlGuard';
import { type Book } from '../../types/book';
import { StarRating } from '../common/StarRating';

interface BookCardProps {
    book: Book;
    onClick?: () => void;
    bulkMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (id: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
    book,
    onClick,
    bulkMode = false,
    isSelected = false,
    onToggleSelection
}) => {
    const coverUrl = getSafeCoverUrl(book);

    // Progress Bar Calculation
    const progressPercent = book.page_count && book.user_progress
        ? Math.min(100, Math.round((book.user_progress / book.page_count) * 100))
        : (book.progress_percentage || 0);

    const displayStatus = book.user_status || book.status;

    return (
        <div
            className={`book-card ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
                if (bulkMode && onToggleSelection) {
                    e.stopPropagation();
                    onToggleSelection(book.id);
                } else if (onClick) {
                    onClick();
                }
            }}
            style={{ cursor: 'pointer' }}
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

            {/* Progress Bar */}
            {((displayStatus === 'In Progress' || displayStatus === 'reading') && progressPercent > 0) && (
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
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, 
                            ${progressPercent < 50 ? '#fbbf24' :
                                progressPercent < 80 ? '#f97316' : '#10b981'})`,
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
                {book.series && (
                    <div className="book-series" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {book.series} {book.series_index ? `#${book.series_index}` : (book.series_order ? `#${book.series_order}` : '')}
                    </div>
                )}
                {book.rating && (
                    <div style={{ marginTop: '4px' }}>
                        <StarRating rating={book.rating} size="small" readonly />
                    </div>
                )}
                <div className="book-badges">
                    {book.series && (
                        <span className="badge badge-series" title={book.series}>
                            {book.series_index ? `Book ${book.series_index}` : (book.series_order ? `Book ${book.series_order}` : book.series)}
                        </span>
                    )}
                    {book.format && <span className="badge badge-format">{book.format}</span>}

                    {displayStatus && <span className={`badge badge-status ${displayStatus.toLowerCase().replace(' ', '-').replace('_', '-')}`}>
                        {displayStatus.replace(/_/g, ' ')}
                    </span>}

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
        </div>
    );
};
