import React, { useState } from 'react';
import type { Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface BookSearchProps {
    onBookSelect: (book: Partial<Book>) => void;
    initialQuery?: string;
}

export const BookSearch: React.FC<BookSearchProps> = ({ onBookSelect, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const hasSearchedRef = React.useRef(false);

    React.useEffect(() => {
        if (initialQuery && !hasSearchedRef.current) {
            setQuery(initialQuery);
            searchBooks(initialQuery);
            hasSearchedRef.current = true;
        }
    }, [initialQuery]);

    const searchBooks = async (searchQuery: string = query) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            // Use backend proxy to avoid CORS and get consistent results
            const data = await bookService.searchOnline(searchQuery);
            setResults(data.items || []);
        } catch (err) {
            console.error(err);
            setError('Failed to search books. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchBooks(query);
        }
    };

    // Editions state
    const [editions, setEditions] = useState<any[]>([]);
    const [isFetchingEditions, setIsFetchingEditions] = useState(false);
    const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

    const handleAddBook = async (item: any) => {
        // If it's a Google Book result (id usually alphanumeric without slashes) or looks specific, add directly
        // If it's an OpenLibrary WORK (id starts with /works/), fetch editions.
        // Google Books IDs don't start with /works/. OL keys do.
        if (item.id.toString().startsWith('/works/')) {
            await fetchEditions(item.id, item.volumeInfo.title);
            return;
        }

        // Function to map item to book
        selectEdition(item);
    };

    const fetchEditions = async (workKey: string, title: string) => {
        setSelectedWorkId(workKey);
        setIsFetchingEditions(true);
        setEditions([]); // Clear previous

        try {
            // We need a proxy endpoint for editions too to avoid CORS?
            // Or we can use the same search endpoint with a designated query if we update backend?
            // Actually, backend needs an endpoint for editions.
            // Let's defer to backend implementation or use existing search with a trick?
            // Better: Add /api/search/editions?work=... to backend.
            const response = await bookService.getEditions(workKey);
            setEditions(response.entries || []);
        } catch (error) {
            console.error('Failed to fetch editions:', error);
            // Fallback to adding the work itself as a generic book
            selectEdition({ id: workKey, volumeInfo: { title, authors: ['Unknown'] } }); // Minimal fallback
            setError('Could not load editions. Added as generic work.');
        } finally {
            setIsFetchingEditions(false);
        }
    };

    const selectEdition = (item: any, isEdition = false) => {
        // Map info
        const volumeInfo = isEdition ? {
            title: item.title,
            authors: item.authors ? item.authors.map((a: any) => a.name || 'Unknown') : [], // OL editions author format might vary
            description: item.description ? (typeof item.description === 'string' ? item.description : item.description.value) : '',
            publisher: item.publishers ? item.publishers[0] : '',
            publishedDate: item.publish_date,
            pageCount: item.number_of_pages,
            categories: item.subjects || [],
            language: '', // OL often misses this in editions
            imageLinks: item.covers ? {
                thumbnail: `https://covers.openlibrary.org/b/id/${item.covers[0]}-M.jpg`
            } : null,
            industryIdentifiers: item.isbn_13 ? [{ type: 'ISBN_13', identifier: item.isbn_13[0] }] :
                (item.isbn_10 ? [{ type: 'ISBN_10', identifier: item.isbn_10[0] }] : [])
        } : item.volumeInfo;

        // ... existing mapping logic ...
        // I will copy the previous logic here but adapted

        let coverUrl = undefined;
        if (volumeInfo.imageLinks) {
            coverUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
            if (coverUrl && coverUrl.startsWith('http://')) {
                coverUrl = coverUrl.replace('http://', 'https://');
            }
        }

        const book: Partial<Book> = {
            title: volumeInfo.title,
            author: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : (volumeInfo.authors || 'Unknown'),
            description: volumeInfo.description || '',
            publisher: volumeInfo.publisher,
            publication_date: volumeInfo.publishedDate,
            page_count: volumeInfo.pageCount,
            categories: volumeInfo.categories || [],
            language: volumeInfo.language || 'en',
            rating: volumeInfo.averageRating,
            cover_url: coverUrl,
            isbn: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ||
                (volumeInfo.industryIdentifiers?.[0]?.identifier) || '',
            library: 'Main Library',
            format: 'Physical',
            binding_type: 'Paperback',
            status: 'Not Started',
            added_at: new Date().toISOString()
        };

        onBookSelect(book);
        setSelectedWorkId(null); // Close modal/list
    };

    return (
        <div className="book-search">
            {/* ... Existing Search Bar ... */}
            <div className="book-search-bar">
                <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="primary-btn"
                    onClick={() => searchBooks(query)}
                    disabled={isLoading}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', textAlign: 'center', marginBottom: '20px' }}>{error}</div>}

            {/* Work Results */}
            {!selectedWorkId && (
                <div className="search-results-grid">
                    {results.map((item) => {
                        const info = item.volumeInfo;
                        const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
                        const isWork = item.id.toString().startsWith('/works/');

                        return (
                            <div key={item.id} className="book-card search-result-card">
                                <div className="search-result-cover">
                                    {cover ? <img src={cover.replace('http://', 'https://')} alt={info.title} /> : <span style={{ fontSize: '2rem' }}>📚</span>}
                                </div>
                                <div className="search-result-info">
                                    <h4 title={info.title}>{info.title}</h4>
                                    <p className="search-result-author">{info.authors ? info.authors[0] : 'Unknown'}</p>
                                    {info.publishedDate && <p className="search-result-year">{info.publishedDate.substring(0, 4)}</p>}
                                    {isWork && <span className="badge" style={{ background: 'var(--accent-color)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>Multiple Editions</span>}
                                </div>
                                <button className="secondary-btn small" onClick={() => handleAddBook(item)}>
                                    {isWork ? 'Select Edition' : '+ Add'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edition Selection View */}
            {selectedWorkId && (
                <div className="editions-view">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <button className="secondary-btn small" onClick={() => setSelectedWorkId(null)}>← Back to Results</button>
                        <h3 style={{ marginLeft: '15px', marginBottom: 0 }}>Select an Edition</h3>
                    </div>

                    {isFetchingEditions ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading editions...</div>
                    ) : (
                        <div className="search-results-grid">
                            {editions.map((edition: any) => {
                                const hasCover = edition.covers && edition.covers.length > 0;
                                const coverUrl = hasCover ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg` : null;

                                return (
                                    <div key={edition.key} className="book-card search-result-card" style={{ border: '1px solid var(--accent-color)' }}>
                                        <div className="search-result-cover">
                                            {coverUrl ? <img src={coverUrl} alt={edition.title} /> : <span style={{ fontSize: '2rem' }}>📖</span>}
                                        </div>
                                        <div className="search-result-info">
                                            <h4>{edition.title}</h4>
                                            <p>{edition.publishers ? edition.publishers[0] : 'Unknown Publisher'}</p>
                                            <p>{edition.publish_date}</p>
                                            {edition.isbn_13 && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ISBN: {edition.isbn_13[0]}</p>}
                                        </div>
                                        <button className="primary-btn small" onClick={() => selectEdition(edition, true)}>
                                            Select This
                                        </button>
                                    </div>
                                );
                            })}
                            {editions.length === 0 && <p>No specific editions found. <button onClick={() => selectEdition({ id: selectedWorkId, volumeInfo: { title: 'Unknown', authors: [] } })}>Add Generic</button></p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
