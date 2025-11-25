import React from 'react';
import { type Book } from '../../types/book';
import { type Shelf } from '../../types/shelf';
import { BookCard } from './BookCard';

interface BookGridProps {
    books: Book[];
    shelves?: Shelf[];
    isLoading?: boolean;
    onBookClick?: (book: Book) => void;
    onEdit?: (book: Book) => void;
    onDelete?: (book: Book) => void;
    onRead?: (book: Book) => void;
    onAddToShelf?: (bookId: number, shelfId: number) => void;
    onUpdateProgress?: (book: Book) => void;
    bulkMode?: boolean;
    selectedBooks?: Set<number>;
    onToggleSelection?: (bookId: number) => void;
}

export const BookGrid: React.FC<BookGridProps> = ({
    books,
    shelves = [],
    isLoading,
    onBookClick,
    onEdit,
    onDelete,
    onRead,
    onAddToShelf,
    onUpdateProgress,
    bulkMode = false,
    selectedBooks = new Set(),
    onToggleSelection
}) => {
    if (isLoading) {
        return (
            <div className="book-grid">
                <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                }}>
                    Loading books...
                </div>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="book-grid">
                <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                }}>
                    No books found. Add your first book to get started!
                </div>
            </div>
        );
    }

    return (
        <div className="book-grid">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    shelves={shelves}
                    onClick={() => onBookClick?.(book)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRead={onRead}
                    onAddToShelf={onAddToShelf}
                    onUpdateProgress={onUpdateProgress}
                    bulkMode={bulkMode}
                    isSelected={selectedBooks.has(book.id)}
                    onToggleSelection={onToggleSelection}
                />
            ))}
        </div>
    );
};
