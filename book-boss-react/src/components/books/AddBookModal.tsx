import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface AddBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookAdded: () => void;
}

interface GoogleBook {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        industryIdentifiers?: Array<{ type: string; identifier: string }>;
        imageLinks?: { thumbnail: string };
    };
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onBookAdded }) => {
    const [activeTab, setActiveTab] = useState<'api' | 'manual'>('api');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Manual entry form
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        library: '',
    });

    const searchGoogleBooks = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10`
            );
            const data = await response.json();
            setSearchResults(data.items || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const addBookFromAPI = async (googleBook: GoogleBook) => {
        const isbn = googleBook.volumeInfo.industryIdentifiers?.find(
            (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || '';

        const bookData: Partial<Book> = {
            title: googleBook.volumeInfo.title,
            author: googleBook.volumeInfo.authors?.join(', ') || 'Unknown',
            isbn,
            cover_url: googleBook.volumeInfo.imageLinks?.thumbnail,
        };

        try {
            await bookService.addBook(bookData);
            onBookAdded();
            handleClose();
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const addBookManually = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await bookService.addBook(formData);
            onBookAdded();
            handleClose();
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setFormData({ title: '', author: '', isbn: '', library: '' });
        setActiveTab('api');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Book">
            <div className="modal-tabs">
                <button
                    className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
                    onClick={() => setActiveTab('api')}
                >
                    API Search
                </button>
                <button
                    className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual Entry
                </button>
            </div>

            {activeTab === 'api' ? (
                <div className="tab-content active">
                    <div className="search-form">
                        <input
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchGoogleBooks()}
                        />
                        <button className="primary-btn" onClick={searchGoogleBooks} disabled={isSearching}>
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    <div className="api-results-list">
                        {searchResults.map((book) => (
                            <div
                                key={book.id}
                                className="api-result-item"
                                onClick={() => addBookFromAPI(book)}
                            >
                                {book.volumeInfo.imageLinks?.thumbnail && (
                                    <img
                                        src={book.volumeInfo.imageLinks.thumbnail}
                                        alt={book.volumeInfo.title}
                                        className="api-result-thumb"
                                    />
                                )}
                                <div>
                                    <div style={{ fontWeight: 600 }}>{book.volumeInfo.title}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="tab-content active">
                    <form onSubmit={addBookManually}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Author *</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>ISBN</label>
                            <input
                                type="text"
                                value={formData.isbn}
                                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Library</label>
                            <input
                                type="text"
                                value={formData.library}
                                onChange={(e) => setFormData({ ...formData, library: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="primary-btn full-width">
                            Add Book
                        </button>
                    </form>
                </div>
            )}
        </Modal>
    );
};
