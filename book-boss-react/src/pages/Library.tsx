import React, { useState, useEffect } from 'react';
import { type Book, type BookFilters } from '../types/book';
import { bookService } from '../services/bookService';
import { BookGrid } from '../components/books/BookGrid';
import { AddBookModal } from '../components/books/AddBookModal';
import { EditBookModal } from '../components/books/EditBookModal';
import { EpubReaderModal } from '../components/books/EpubReaderModal';
import { Sidebar, type SidebarFilter } from '../components/layout/Sidebar';
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
    const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Sidebar state
    const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>({ type: 'all' });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    // Toast state
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });

    // Bulk selection state
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const [bulkMode, setBulkMode] = useState(false);

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

        // Apply sidebar filter first
        if (sidebarFilter.type === 'status' && sidebarFilter.value) {
            result = result.filter(book => book.status === sidebarFilter.value);
        } else if (sidebarFilter.type === 'format' && sidebarFilter.value) {
            result = result.filter(book => book.format === sidebarFilter.value);
        } else if (sidebarFilter.type === 'shelf' && sidebarFilter.value) {
            result = result.filter(book => book.shelf === sidebarFilter.value);
        }

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
            case 'rating_desc':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'page_count_desc':
                result.sort((a, b) => (b.page_count || 0) - (a.page_count || 0));
                break;
            case 'pub_date_desc':
                result.sort((a, b) => new Date(b.publication_date || 0).getTime() - new Date(a.publication_date || 0).getTime());
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

    const handleRead = (book: Book) => {
        setSelectedBook(book);
        setIsReaderModalOpen(true);
    };

    const toggleBookSelection = (bookId: number) => {
        const newSelection = new Set(selectedBooks);
        if (newSelection.has(bookId)) {
            newSelection.delete(bookId);
        } else {
            newSelection.add(bookId);
        }
        setSelectedBooks(newSelection);
    };

    const handleBulkDelete = async () => {
        if (selectedBooks.size === 0) return;
        if (window.confirm(`Delete ${selectedBooks.size} selected books?`)) {
            try {
                await Promise.all(Array.from(selectedBooks).map(id => bookService.deleteBook(id)));
                loadBooks();
                setSelectedBooks(new Set());
                setBulkMode(false);
                showToast(`${selectedBooks.size} books deleted successfully!`, 'success');
            } catch (error) {
                console.error('Error deleting books:', error);
                showToast('Failed to delete some books', 'error');
            }
        }
    };

    const handleBulkUpdateShelf = async (shelf: string) => {
        if (selectedBooks.size === 0) return;
        try {
            await Promise.all(Array.from(selectedBooks).map(id =>
                bookService.updateBook(id, { shelf })
            ));
            loadBooks();
            setSelectedBooks(new Set());
            setBulkMode(false);
            showToast(`Updated ${selectedBooks.size} books!`, 'success');
        } catch (error) {
            console.error('Error updating books:', error);
            showToast('Failed to update some books', 'error');
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

    // Calculate book counts for sidebar
    const bookCounts = {
        total: books.length,
        notStarted: books.filter(b => b.status === 'Not Started').length,
        inProgress: books.filter(b => b.status === 'In Progress').length,
        completed: books.filter(b => b.status === 'Completed').length,
        dnf: books.filter(b => b.status === 'DNF').length,
        physical: books.filter(b => b.format === 'Physical').length,
        ebook: books.filter(b => b.format === 'Ebook').length,
        audiobook: books.filter(b => b.format === 'Audiobook').length,
    };

    // Get unique shelves
    const shelves = Array.from(new Set(books.map(b => b.shelf).filter(Boolean))) as string[];

    return (
        <>
            {isSidebarVisible && (
                <Sidebar
                    activeFilter={sidebarFilter}
                    onFilterChange={setSidebarFilter}
                    shelves={shelves}
                    bookCounts={bookCounts}
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <div style={{ marginLeft: isSidebarVisible ? 'var(--sidebar-width)' : '0', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
                <div className="top-bar">
                    <button
                        className="secondary-btn small"
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        style={{ marginRight: '10px' }}
                        title={isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                    >
                        {isSidebarVisible ? '◀' : '▶'}
                    </button>
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
                            <option value="rating_desc">Highest Rated</option>
                            <option value="page_count_desc">Longest</option>
                            <option value="pub_date_desc">Newest Published</option>
                        </select>
                        <button
                            className="secondary-btn small"
                            onClick={() => {
                                setBulkMode(!bulkMode);
                                setSelectedBooks(new Set());
                            }}
                            style={{ marginRight: '10px' }}
                        >
                            {bulkMode ? 'Cancel' : 'Select Multiple'}
                        </button>
                        <button className="fab" onClick={() => setIsAddModalOpen(true)}>
                            +
                        </button>
                    </div>
                </div>


                {/* Bulk Actions Toolbar */}
                {bulkMode && selectedBooks.size > 0 && (
                    <div style={{
                        padding: '12px 30px',
                        background: 'var(--glass-bg)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                    }}>
                        <span style={{ marginRight: 'auto', color: 'var(--text-primary)' }}>
                            {selectedBooks.size} book(s) selected
                        </span>
                        <button className="secondary-btn small" onClick={handleBulkDelete}>
                            Delete Selected
                        </button>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkUpdateShelf(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--glass-bg)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="">Move to Shelf...</option>
                            <option value="To Read">To Read</option>
                            <option value="Currently Reading">Currently Reading</option>
                            <option value="Favorites">Favorites</option>
                            <option value="Archive">Archive</option>
                        </select>
                    </div>
                )}

                <BookGrid
                    books={filteredBooks}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRead={handleRead}
                    bulkMode={bulkMode}
                    selectedBooks={selectedBooks}
                    onToggleSelection={toggleBookSelection}
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

                <EpubReaderModal
                    isOpen={isReaderModalOpen}
                    onClose={() => setIsReaderModalOpen(false)}
                    epubUrl={selectedBook?.epub_file_path ? `http://localhost:3000/${selectedBook.epub_file_path}` : ''}
                    bookTitle={selectedBook?.title || ''}
                    bookId={selectedBook?.id}
                />

                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast({ ...toast, isVisible: false })}
                />
            </div>
        </>
    );
};
