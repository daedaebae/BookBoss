import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { BarcodeScanner } from './BarcodeScanner';
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
    const [activeTab, setActiveTab] = useState<'api' | 'manual' | 'scan'>('scan');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Manual entry form
    const [formData, setFormData] = useState<Partial<Book>>({
        title: '',
        author: '',
        isbn: '',
        library: '',
        format: '',
        series: '',
        shelf: '',
        status: undefined,
    });



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
            // Remove empty string fields to match Book type expectations
            const sanitizedData: Partial<Book> = { ...formData };
            if (!sanitizedData.format) delete sanitizedData.format;
            if (!sanitizedData.series) delete sanitizedData.series;
            if (!sanitizedData.shelf) delete sanitizedData.shelf;
            if (!sanitizedData.status) delete sanitizedData.status;
            await bookService.addBook(sanitizedData);
            onBookAdded();
            handleClose();
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setFormData({ title: '', author: '', isbn: '', library: '', format: '', series: '', shelf: '', status: undefined });
        setActiveTab('scan');
        onClose();
    };

    const handleScanSuccess = (decodedText: string) => {
        // Clean ISBN (remove dashes)
        const cleanIsbn = decodedText.replace(/-/g, '').trim();
        setSearchQuery(`isbn:${cleanIsbn}`);
        setActiveTab('api');
        // Trigger search immediately
        // We need to use the cleanIsbn directly because setState is async
        searchGoogleBooks(`isbn:${cleanIsbn}`);
    };

    // Overload searchGoogleBooks to accept a query argument
    const searchGoogleBooks = async (queryOverride?: string) => {
        const query = queryOverride || searchQuery;
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
            );
            const data = await response.json();
            setSearchResults(data.items || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Book">
            <div className="modal-tabs">
                <button
                    className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    Scan Barcode
                </button>
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
                        <button className="primary-btn" onClick={() => searchGoogleBooks()} disabled={isSearching}>
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
            ) : activeTab === 'scan' ? (
                <div className="tab-content active">
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                        onScanFailure={(err) => console.log(err)}
                    />
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
                        <div className="form-group">
                            <label>Format</label>
                            <select
                                value={formData.format || ''}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                            >
                                <option value="">Select format</option>
                                <option value="Physical">Physical</option>
                                <option value="Ebook">Ebook</option>
                                <option value="Audiobook">Audiobook</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Series</label>
                            <input
                                type="text"
                                value={formData.series || ''}
                                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Shelf</label>
                            <input
                                type="text"
                                value={formData.shelf || ''}
                                onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status || ''}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="">Select status</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="DNF">DNF</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Rating (0-5)</label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.5"
                                value={formData.rating || ''}
                                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Page Count</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.page_count || ''}
                                onChange={(e) => setFormData({ ...formData, page_count: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Publication Date</label>
                            <input
                                type="date"
                                value={formData.publication_date || ''}
                                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="secondary-btn" onClick={handleClose}>
                                Cancel
                            </button>
                            <button type="submit" className="primary-btn" style={{ flex: 1 }}>
                                Add Book
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </Modal>
    );
};
