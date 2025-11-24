import React, { useState, useEffect } from 'react';
import { type Book, type BookFilters } from '../types/book';
import { bookService } from '../services/bookService';
import { BookGrid } from '../components/books/BookGrid';

export const Library: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<BookFilters>({
        search: '',
        sortBy: 'added_desc',
    });

    // Fetch books on mount
    useEffect(() => {
        loadBooks();
    }, []);

    // Apply filters whenever books or filters change
    useEffect(() => {
        applyFilters();
    }, [books, filters]);

    const loadBooks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await bookService.getBooks();
            setBooks(data);
        } catch (err) {
            setError('Failed to load books. Please try again.');
            console.error('Error loading books:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...books];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                (book) =>
                    book.title.toLowerCase().includes(searchLower) ||
                    book.author.toLowerCase().includes(searchLower) ||
                    book.isbn?.toLowerCase().includes(searchLower)
            );
        }

        // Library filter
        if (filters.library) {
            result = result.filter((book) => book.library === filters.library);
        }

        // Sort
        switch (filters.sortBy) {
            case 'added_desc':
                result.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
                break;
            case 'added_asc':
                result.sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime());
                break;
            case 'title_asc':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'author_asc':
                result.sort((a, b) => a.author.localeCompare(b.author));
                break;
        }

        setFilteredBooks(result);
    };

    const handleSearch = (searchTerm: string) => {
        setFilters((prev) => ({ ...prev, search: searchTerm }));
    };

    const handleBookClick = (book: Book) => {
        console.log('Book clicked:', book);
        // TODO: Open book details modal
    };

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger-color)' }}>
                {error}
            </div>
        );
    }

    return (
        <>
            <div className="top-bar">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search books by title, author, or ISBN..."
                        value={filters.search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="header-actions">
                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as BookFilters['sortBy'] }))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--glass-bg)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <option value="added_desc">Recently Added</option>
                        <option value="added_asc">Oldest First</option>
                        <option value="title_asc">Title (A-Z)</option>
                        <option value="author_asc">Author (A-Z)</option>
                    </select>
                </div>
            </div>
            <BookGrid
                books={filteredBooks}
                isLoading={isLoading}
                onBookClick={handleBookClick}
            />
        </>
    );
};
