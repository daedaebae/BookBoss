import React, { useState } from 'react'; // Fixed hooks imports
import { type Book, type BookFilters } from '../types/book';
import { BookGrid } from '../components/books/BookGrid';
import { AddBookModal } from '../components/books/AddBookModal';
import { EditBookModal } from '../components/books/EditBookModal';
import { EpubReaderModal } from '../components/books/EpubReaderModal';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { Sidebar, type SidebarFilter } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Toast } from '../components/common/Toast';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { ShelfManagerModal } from '../components/shelves/ShelfManagerModal';
import { UpdateProgressModal } from '../components/books/UpdateProgressModal';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../hooks/queries/useBooks';
import { useShelves } from '../hooks/queries/useShelves';
import { useBookMutations } from '../hooks/queries/useBookMutations';
import { MetadataRefreshModal } from '../components/books/MetadataRefreshModal';

export const Library: React.FC = () => {
    // const { theme, setTheme } = useTheme(); // Moved to Header
    const { user, logout } = useAuth();

    // Sidebar state
    const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>(() => {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type') as SidebarFilter['type'] || 'all';
        const value = params.get('value') || undefined;
        const shelfId = params.get('shelfId') ? parseInt(params.get('shelfId')!) : undefined;
        const userId = params.get('userId') ? parseInt(params.get('userId')!) : undefined;

        // Clear params to avoid sticky filters on refresh if desired, 
        // but for now keeping them allows bookmarking/refreshing with filter.
        // If we wanted to clear them: window.history.replaceState({}, '', '/');

        return { type, value, shelfId, userId };
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    // React Query Hooks (Dependent on sidebarFilter)
    const { data: books = [], isLoading: isBooksLoading, error: booksError } = useBooks(sidebarFilter.type === 'user' ? sidebarFilter.userId : undefined);
    const { data: shelves = [], refetch: refetchShelves } = useShelves();
    const { deleteBook, bulkDeleteBooks, bulkUpdateShelf, addToShelf } = useBookMutations();

    // const [filteredBooks, setFilteredBooks] = useState<Book[]>([]); // Removed state

    const [filters, setFilters] = useState<BookFilters>({
        search: '',
        sortBy: 'added_desc',
    });

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isShelfManagerOpen, setIsShelfManagerOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [isMetadataRefreshOpen, setIsMetadataRefreshOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Toast state
    const [toast, setToast] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info', isVisible: false });

    // Bulk selection state
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const [bulkMode, setBulkMode] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isDanger });
    };

    // Derive distinct libraries from the user's books
    const userLibraries = React.useMemo(() => {
        const libs = new Set(books.map(b => b.library).filter(Boolean));
        return Array.from(libs) as string[];
    }, [books]);

    const filteredBooks = React.useMemo(() => {
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
            // Fallback to legacy string shelf if no shelfId
            result = result.filter(book => book.shelf === sidebarFilter.value);
        } else if (sidebarFilter.type === 'series' && sidebarFilter.value) {
            result = result.filter(book => book.series === sidebarFilter.value);
            // Auto-sort by series_order when filtering by series
            result.sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
        } else if (sidebarFilter.type === 'loaned') {
            result = result.filter(book => book.is_loaned);
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

        return result;
    }, [books, filters, sidebarFilter]);

    const handleSearch = (searchTerm: string) => {
        setFilters((prev) => ({ ...prev, search: searchTerm }));
    };

    const handleBookAdded = () => {
        // loadBooks(); // Query auto invalidates
        showToast('Book added successfully!', 'success');
    };

    const handleBookUpdated = () => {
        // loadBooks();
        showToast('Book updated successfully!', 'success');
    };

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (book: Book) => {
        openConfirm(
            'Delete Book',
            `Are you sure you want to delete "${book.title}"?`,
            async () => {
                try {
                    await deleteBook.mutateAsync(book.id);
                    showToast('Book deleted successfully!', 'success');
                } catch (error) {
                    console.error('Error deleting book:', error);
                    showToast('Failed to delete book', 'error');
                }
            },
            true
        );
    };

    const handleRead = (book: Book) => {
        setSelectedBook(book);
        setIsReaderModalOpen(true);
    };

    const handleBookClick = (book: Book) => {
        setSelectedBook(book);
        setIsDetailModalOpen(true);
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

        openConfirm(
            'Bulk Delete',
            `Delete ${selectedBooks.size} selected books?`,
            async () => {
                try {
                    await bulkDeleteBooks.mutateAsync(Array.from(selectedBooks));
                    setSelectedBooks(new Set());
                    setBulkMode(false);
                    showToast(`${selectedBooks.size} books deleted successfully!`, 'success');
                } catch (error) {
                    console.error('Error deleting books:', error);
                    showToast('Failed to delete some books', 'error');
                }
            },
            true
        );
    };

    const handleBulkUpdateShelf = async (shelf: string) => {
        if (selectedBooks.size === 0) return;
        try {
            await bulkUpdateShelf.mutateAsync({ ids: Array.from(selectedBooks), shelf });
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
            await addToShelf.mutateAsync({ bookId, shelfId });
            showToast('Book added to shelf', 'success');
        } catch (error) {
            console.error('Error adding to shelf:', error);
            showToast('Failed to add book to shelf', 'error');
        }
    };

    const handleUpdateProgress = (book: Book) => {
        setSelectedBook(book);
        setIsProgressModalOpen(true);
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    if (booksError) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger-color)' }}>
                {booksError.message || 'Error loading books'}
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
        loaned: books.filter(b => b.is_loaned).length,
        overdue: books.filter(b => b.is_loaned && b.due_date && new Date(b.due_date) < new Date()).length,
    };

    // Get unique series
    const seriesList = Array.from(new Set(books.map(b => b.series).filter(Boolean))) as string[];

    return (
        <>
            <Sidebar
                activeFilter={sidebarFilter}
                onFilterChange={setSidebarFilter}
                shelves={shelves}
                seriesList={seriesList}
                onManageShelves={() => setIsShelfManagerOpen(true)}
                bookCounts={bookCounts}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                isVisible={isSidebarVisible}
                user={user}
                onLogout={logout}

                onSettingsClick={() => setIsSettingsModalOpen(true)}
                userLibraries={userLibraries}
            />

            <div className="content-area" style={{ marginLeft: isSidebarVisible ? 'var(--sidebar-width)' : '0', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
                <Header
                    onMobileSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onDesktopSidebarToggle={() => setIsSidebarVisible(!isSidebarVisible)}
                    isSidebarVisible={isSidebarVisible}
                    searchBar={
                        <input
                            type="text"
                            placeholder="Search books..."
                            value={filters.search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    }
                >
                    <button
                        className="secondary-btn small"
                        onClick={() => {
                            setBulkMode(!bulkMode);
                            setSelectedBooks(new Set());
                        }}
                    >
                        {bulkMode ? 'Cancel' : 'Select'}
                    </button>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as BookFilters['sortBy'] }))}
                        className="secondary-btn small"
                        style={{
                            paddingRight: '30px', // Space for dropdown arrow
                            appearance: 'none',   // Remove default arrow
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            backgroundSize: '16px',
                            color: 'var(--accent-color)',
                            borderColor: 'var(--accent-color)'
                        }}
                    >
                        <option value="added_desc">Recent</option>
                        <option value="added_asc">Oldest</option>
                        <option value="title_asc">Title</option>
                        <option value="author_asc">Author</option>
                        <option value="rating_desc">Rating</option>
                        <option value="page_count_desc">Length</option>
                        <option value="pub_date_desc">Published</option>
                    </select>

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
                        <span>Add</span>
                    </button>
                </Header>


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
                    isLoading={isBooksLoading}
                    onBookClick={handleBookClick}
                    bulkMode={bulkMode}
                    selectedBooks={selectedBooks}
                    onToggleSelection={toggleBookSelection}
                />

                <BookDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    book={selectedBook}
                    shelves={shelves}
                    onEdit={(book) => {
                        setIsDetailModalOpen(false);
                        handleEdit(book);
                    }}
                    onDelete={(book) => {
                        setIsDetailModalOpen(false);
                        handleDelete(book);
                    }}
                    onRead={(book) => {
                        setIsDetailModalOpen(false);
                        handleRead(book);
                    }}
                    onAddToShelf={handleAddToShelf}
                    onUpdateProgress={handleUpdateProgress}
                />

                <AddBookModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onBookAdded={handleBookAdded}
                />

                <EditBookModal
                    key={selectedBook?.id || 'edit-empty'}
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
                    onShelvesUpdated={() => refetchShelves()}
                />

                <UpdateProgressModal
                    key={selectedBook?.id || 'progress-empty'}
                    isOpen={isProgressModalOpen}
                    onClose={() => setIsProgressModalOpen(false)}
                    book={selectedBook}
                    onProgressUpdated={() => { }} // Query invalidates
                />

                <MetadataRefreshModal
                    isOpen={isMetadataRefreshOpen}
                    onClose={() => setIsMetadataRefreshOpen(false)}
                    onRefreshComplete={() => { }} // Query invalidates
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

                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    isDanger={confirmModal.isDanger}
                />
            </div>
        </>
    );
};
