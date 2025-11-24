import React, { useState, useEffect } from 'react';
import { type Book, type BookFilters } from '../types/book';
import { bookService } from '../services/bookService';
import { BookGrid } from '../components/books/BookGrid';
import { AddBookModal } from '../components/books/AddBookModal';
import { EditBookModal } from '../components/books/EditBookModal';
import { Toast } from '../components/common/Toast';

export const Library: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<BookFilters>({
        search: '',
        sortBy: 'added_desc',
    });

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Toast state
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });

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

    const handleBookAdded = () => {
        loadBooks();
        showToast('Book added successfully!', 'success');
    };

    const handleBookUpdated = () => {
        loadBooks();
        showToast('Book updated successfully!', 'success');
    };

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (book: Book) => {
        if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
            try {
                await bookService.deleteBook(book.id);
                loadBooks();
                showToast('Book deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting book:', error);
                showToast('Failed to delete book', 'error');
            }
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
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
                            marginRight: '10px',
                        }}
                    >
                        <option value="added_desc">Recently Added</option>
                        <option value="added_asc">Oldest First</option>
                        <option value="title_asc">Title (A-Z)</option>
                        <option value="author_asc">Author (A-Z)</option>
                    </select>
                    <button className="fab" onClick={() => setIsAddModalOpen(true)}>
                        +
                    </button>
                </div>
            </div>
            <BookGrid
                books={filteredBooks}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <AddBookModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onBookAdded={handleBookAdded}
            />

            <EditBookModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                book={selectedBook}
                onBookUpdated={handleBookUpdated}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />
        </>
    );
};
