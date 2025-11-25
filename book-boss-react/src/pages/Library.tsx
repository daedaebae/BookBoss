import React, { useState, useEffect } from 'react';
import { type Book, type BookFilters } from '../types/book';
import { bookService } from '../services/bookService';
import { BookGrid } from '../components/books/BookGrid';
import { AddBookModal } from '../components/books/AddBookModal';
import { EditBookModal } from '../components/books/EditBookModal';
import { EpubReaderModal } from '../components/books/EpubReaderModal';
import { Sidebar, type SidebarFilter } from '../components/layout/Sidebar';
import { Toast } from '../components/common/Toast';
import { SettingsModal } from '../components/settings/SettingsModal';
import { ShelfManagerModal } from '../components/shelves/ShelfManagerModal';
import { UpdateProgressModal } from '../components/books/UpdateProgressModal';
import { shelfService } from '../services/shelfService';
import { type Shelf } from '../types/shelf';

export const Library: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<BookFilters>({
        search: '',
        sortBy: 'added_desc',
    });

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
    const [isShelfManagerOpen, setIsShelfManagerOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Sidebar state
    const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>({ type: 'all' });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Toast state
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });

    // Bulk selection state
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const [bulkMode, setBulkMode] = useState(false);

    // Fetch books and shelves on mount
    useEffect(() => {
        loadBooks();
        loadShelves();
    }, []);

    // Apply filters whenever books, filters, or sidebar filter change
    useEffect(() => {
        applyFilters();
    }, [books, filters, sidebarFilter]);

    useEffect(() => {
        // Apply theme
        document.body.className = isDarkMode ? '' : 'light-theme';
    }, [isDarkMode]);

    const loadBooks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Fetch books and user progress in parallel
            const [booksData, userBooksData] = await Promise.all([
                bookService.getBooks(),
                bookService.getUserBooks().catch(() => []) // Silently fail if auth error
            ]);

            // Merge user progress into books
            const mergedBooks = booksData.map(book => {
                const userBook = userBooksData.find((ub: any) => ub.book_id === book.id);
                if (userBook) {
                    return {
                        ...book,
                        user_status: userBook.status,
                        user_progress: userBook.progress,
                        user_rating: userBook.rating
                    };
                }
                return book;
            });

            setBooks(mergedBooks);
        } catch (err) {
            setError('Failed to load books. Please try again.');
            console.error('Error loading books:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadShelves = async () => {
        try {
            const data = await shelfService.getShelves();
            setShelves(data);
        } catch (err) {
            console.error('Error loading shelves:', err);
        }
    };

    const applyFilters = () => {
        let result = [...books];

        // Apply sidebar filter first
        if (sidebarFilter.type === 'status' && sidebarFilter.value) {
            result = result.filter(book => book.status === sidebarFilter.value);
        } else if (sidebarFilter.type === 'format' && sidebarFilter.value) {
            result = result.filter(book => book.format === sidebarFilter.value);
        } else if (sidebarFilter.type === 'shelf' && sidebarFilter.shelfId) {
            // New logic for mapped shelves
            result = result.filter(book => book.shelf_ids && book.shelf_ids.includes(sidebarFilter.shelfId!));
        } else if (sidebarFilter.type === 'shelf' && sidebarFilter.value) {
            // Fallback to legacy string shelf if no shelfId (though we probably won't use this much)
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

    const handleUpdateProgress = (book: Book) => {
        setSelectedBook(book);
        setIsProgressModalOpen(true);
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
            await Promise.all(Array.from(selectedBooks).map(id => {
                const formData = new FormData();
                formData.append('shelf', shelf);
                return bookService.updateBook(id, formData);
            }));
            loadBooks();
            setSelectedBooks(new Set());
            setBulkMode(false);
            showToast(`Updated ${selectedBooks.size} books!`, 'success');
        } catch (error) {
            console.error('Error updating books:', error);
            showToast('Failed to update some books', 'error');
        }
    };

    const handleAddToShelf = async (bookId: number, shelfId: number) => {
        try {
            await shelfService.addBookToShelf(shelfId, bookId);
            showToast('Book added to shelf', 'success');
            loadBooks(); // Reload to update shelf_ids
        } catch (error) {
            console.error('Error adding to shelf:', error);
            showToast('Failed to add book to shelf', 'error');
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

    return (
        <>
            {isSidebarVisible && (
                <Sidebar
                    activeFilter={sidebarFilter}
                    onFilterChange={setSidebarFilter}
                    shelves={shelves}
                    onManageShelves={() => setIsShelfManagerOpen(true)}
                    bookCounts={bookCounts}
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={() => setIsMobileSidebarOpen(false)}
                    onToggleSidebar={() => setIsSidebarVisible(false)}
                />
            )}

            <div style={{ marginLeft: isSidebarVisible ? 'var(--sidebar-width)' : '0', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
                <div className="top-bar">
                    {!isSidebarVisible && (
                        <button
                            className="secondary-btn small"
                            onClick={() => setIsSidebarVisible(true)}
                            style={{ marginRight: '10px' }}
                            title="Show Sidebar"
                        >
                            ▶
                        </button>
                    )}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search books by title, author, or ISBN..."
                            value={filters.search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                        >
                            {bulkMode ? 'Cancel' : 'Select Multiple'}
                        </button>
                    </div>

                    {/* Theme Toggle and Add Book - Fixed Position */}
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        {/* Dark/Light Mode Toggle */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            background: 'var(--glass-bg)',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '🌙' : '☀️'}</span>
                            <input
                                type="checkbox"
                                checked={!isDarkMode}
                                onChange={() => setIsDarkMode(!isDarkMode)}
                                style={{ display: 'none' }}
                            />
                            <div style={{
                                width: '40px',
                                height: '20px',
                                background: isDarkMode ? 'var(--text-secondary)' : 'var(--accent-color)',
                                borderRadius: '10px',
                                position: 'relative',
                                transition: 'background 0.3s'
                            }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '2px',
                                    left: isDarkMode ? '2px' : '22px',
                                    transition: 'left 0.3s'
                                }} />
                            </div>
                        </label>

                        {/* Settings Button */}
                        <button
                            className="secondary-btn"
                            onClick={() => setIsSettingsModalOpen(true)}
                            style={{
                                padding: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                width: '42px',
                                height: '42px'
                            }}
                            title="Settings"
                        >
                            ⚙️
                        </button>

                        {/* Add Book Button */}
                        <button
                            className="primary-btn"
                            onClick={() => setIsAddModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                fontSize: '1rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>+</span>
                            <span>Add Book</span>
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
                    shelves={shelves}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRead={handleRead}
                    onAddToShelf={handleAddToShelf}
                    onUpdateProgress={handleUpdateProgress}
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

                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                />

                <ShelfManagerModal
                    isOpen={isShelfManagerOpen}
                    onClose={() => setIsShelfManagerOpen(false)}
                    onShelvesUpdated={loadShelves}
                />

                <UpdateProgressModal
                    isOpen={isProgressModalOpen}
                    onClose={() => setIsProgressModalOpen(false)}
                    book={selectedBook}
                    onProgressUpdated={loadBooks}
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
