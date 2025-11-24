import React from 'react';
import { type Book } from '../../types/book';

interface BookCardProps {
    book: Book;
    onClick?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
    const coverUrl = book.cover_url
        ? `http://localhost:3000${book.cover_url}`
        : 'https://via.placeholder.com/140x210?text=No+Cover';

    return (
        <div className="book-card" onClick={onClick}>
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
        </div>
    );
};
