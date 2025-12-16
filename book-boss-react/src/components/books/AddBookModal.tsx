import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { BarcodeScanner } from './BarcodeScanner';
import { BookSearch } from './BookSearch';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';
import { absService, type AbsSearchResult } from '../../services/absService';

interface AddBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookAdded: () => void;
}

type Tab = 'manual' | 'api' | 'scan' | 'search' | 'abs';



export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onBookAdded }) => {
    const [activeTab, setActiveTab] = useState<Tab>('search'); // Default to search for better UX? Or keep manual. Let's stick to manual default for now, or maybe 'search' as requested in features.
    // Actually, let's make 'search' the default if that's the new primary way.
    // But for now, let's just add the tab.

    // Manual entry form
    const [formData, setFormData] = useState<Partial<Book>>({
        title: '',
        author: '',
        isbn: '',
        library: '',
        format: '',
        series: '',
        series_index: undefined,
        publisher: '',
        language: 'en',
        description: '',
        shelf: '',
        status: undefined,
        cover_url: '',
        categories: '',
        publication_date: '',
        rating: undefined,
        page_count: undefined,
    });

    const addBookManually = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use FormData to allow file uploads if we add them later, but for now just JSON-like payload via object
            // Actually service now expects FormData or object, but the updated service sends json if object.
            // Wait, I updated bookService to expect FormData. I should wrap it.

            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'cover_url') {
                        data.append('cover', value.toString());
                    } else {
                        data.append(key, value.toString());
                    }
                }
            });

            await bookService.addBook(data);
            onBookAdded();
            handleClose();
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book. Please check the console for details.');
        }
    };

    const handleClose = () => {
        setFormData({
            title: '', author: '', isbn: '', library: '', format: '',
            series: '', series_index: undefined, publisher: '', language: 'en', description: '',
            shelf: '', status: undefined,
            cover_url: '', categories: '', publication_date: '', rating: undefined, page_count: undefined
        });
        setActiveTab('search'); // Reset to 'search' tab on close
        onClose();
    };

    const handleScanSuccess = (decodedText: string) => {
        // Clean ISBN (remove dashes)
        const cleanIsbn = decodedText.replace(/-/g, '').trim();
        // TODO: Pass this to BookSearch or Manual entry
        console.log('Scanned ISBN:', cleanIsbn);
        alert(`Scanned ISBN: ${cleanIsbn}. Please search or enter manually.`);
    };

    const handleBookSelect = (book: Partial<Book>) => {
        // Populate form with selected book
        setFormData(prevData => ({
            ...prevData,
            title: book.title || '',
            author: book.author || '',
            isbn: book.isbn || '',
            cover_url: book.cover_url || '',
            categories: Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || ''),
            publication_date: book.publication_date || '',
            rating: book.rating,
            page_count: book.page_count,
        }));

        // Switch to manual tab to review/edit before saving
        setActiveTab('manual');
    };

    // ABS Integration
    const [absSearchQuery, setAbsSearchQuery] = useState('');
    const [absSearchResults, setAbsSearchResults] = useState<AbsSearchResult[]>([]);
    const [isAbsSearching, setIsAbsSearching] = useState(false);

    const handleAbsSearch = async () => {
        if (!absSearchQuery.trim()) return;
        setIsAbsSearching(true);
        try {
            const results = await absService.search(absSearchQuery);
            setAbsSearchResults(results);
        } catch (error) {
            console.error('ABS Search Error:', error);
            // Optionally show toast error
        } finally {
            setIsAbsSearching(false);
        }
    };

    const handleAbsImport = async (item: AbsSearchResult) => {
        try {
            await absService.importBook(item);
            onBookAdded();
            handleClose();
        } catch (error) {
            console.error('ABS Import Error:', error);
            // Optionally show toast error
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Book">
            <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <button
                    className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual Entry
                </button>
                <button
                    className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    Online Search
                </button>
                <button
                    className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    Scan Barcode
                </button>
                {/* Legacy Google API removed */}
                <button
                    className={`tab-btn ${activeTab === 'abs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('abs')}
                >
                    Audiobookshelf
                </button>
            </div>

            {activeTab === 'search' && (
                <BookSearch onBookSelect={handleBookSelect} />
            )}

            {/* Legacy API tab content removed */}

            {activeTab === 'abs' && (
                <div className="tab-content active">
                    <div className="text-sm text-gray-400 mb-4">
                        Search across all your connected Audiobookshelf servers.
                    </div>
                    {/* ... (rest of ABS content remains) ... */}
                    <div className="search-form">
                        <input
                            type="text"
                            placeholder="Search Audiobookshelf..."
                            value={absSearchQuery}
                            onChange={(e) => setAbsSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAbsSearch()}
                        />
                        <button className="primary-btn" onClick={() => handleAbsSearch()} disabled={isAbsSearching}>
                            {isAbsSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    <div className="api-results-list">
                        {absSearchResults.map((item) => (
                            <div
                                key={item.id}
                                className="api-result-item"
                                onClick={() => handleAbsImport(item)}
                            >
                                {item.media.coverPath ? (
                                    <div className="api-result-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        🎧
                                    </div>
                                ) : (
                                    <div className="api-result-thumb" />
                                )}
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.media.metadata.title || item.name}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {item.media.metadata.authorName || (item.media.metadata.authors && item.media.metadata.authors.length > 0 ? item.media.metadata.authors[0].name : 'Unknown Author')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px' }}>
                                        {item._server.name} • {item._library.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {absSearchResults.length === 0 && !isAbsSearching && absSearchQuery && (
                            <div className="text-center text-gray-500 mt-4">No results found.</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'scan' && (
                <div className="tab-content active">
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                        onScanFailure={(err) => console.log(err)}
                    />
                </div>
            )}

            {activeTab === 'manual' && (
                <div className="tab-content active">
                    <form onSubmit={addBookManually}>
                        {/* Cover Preview */}
                        {formData.cover_url && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <img
                                    src={formData.cover_url}
                                    alt="Cover Preview"
                                    style={{ height: '200px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Cover URL</label>
                            <input
                                type="text"
                                value={formData.cover_url || ''}
                                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

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
                            <label>Categories (comma separated)</label>
                            <input
                                type="text"
                                value={formData.categories || ''}
                                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                placeholder="Fiction, Thriller, etc."
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
                        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 2 }}>
                                <label>Series</label>
                                <input
                                    type="text"
                                    value={formData.series || ''}
                                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Index</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.series_index || ''}
                                    onChange={(e) => setFormData({ ...formData, series_index: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Publisher</label>
                            <input
                                type="text"
                                value={formData.publisher || ''}
                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Language</label>
                            <input
                                type="text"
                                value={formData.language || ''}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
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
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
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
