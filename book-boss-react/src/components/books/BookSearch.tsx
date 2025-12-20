import React, { useState } from 'react';
import type { Book } from '../../types/book';

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
            const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=20`);
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }
            const data = await response.json();
            setResults(data.docs || []);
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

    const handleAddBook = async (doc: any) => {
        setIsLoading(true);
        try {
            // Fetch detailed work info for description
            let description = '';
            if (doc.key) {
                try {
                    const workRes = await fetch(`https://openlibrary.org${doc.key}.json`);
                    if (workRes.ok) {
                        const workData = await workRes.json();
                        description = typeof workData.description === 'string'
                            ? workData.description
                            : workData.description?.value || '';
                    }
                } catch (e) {
                    console.error('Failed to fetch work details', e);
                }
            }

            const coverId = doc.cover_i;
            const book: Partial<Book> = {
                title: doc.title,
                author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
                isbn: doc.isbn ? doc.isbn[0] : '',
                cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
                categories: doc.subject ? doc.subject.slice(0, 5) : [],
                publication_date: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
                publisher: doc.publisher ? doc.publisher[0] : undefined,
                page_count: doc.number_of_pages_median || undefined,
                description: description,
                library: 'Main Library',
                format: 'Physical',
                binding_type: 'Paperback',
                status: 'Not Started',
                added_at: new Date().toISOString()
            };
            onBookSelect(book);
        } catch (error) {
            console.error('Error preparing book details:', error);
            // Fallback to basic details
            const coverId = doc.cover_i;
            onBookSelect({
                title: doc.title,
                author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
                cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="book-search">
            <div className="search-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ flex: 1 }}
                />
                <button
                    className="primary-btn"
                    onClick={() => searchBooks(query)}
                    disabled={isLoading}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div style={{ color: 'var(--danger-color)', textAlign: 'center', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            <div className="search-results-grid">
                {results.map((doc, index) => (
                    <div key={doc.key || index} className="book-card search-result-card">
                        <div className="search-result-cover">
                            {doc.cover_i ? (
                                <img
                                    src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`}
                                    alt={doc.title}
                                />
                            ) : (
                                <span style={{ fontSize: '2rem' }}>📚</span>
                            )}
                        </div>
                        <div className="search-result-info">
                            <h4 title={doc.title}>
                                {doc.title}
                            </h4>
                            <p className="search-result-author">
                                {doc.author_name ? doc.author_name[0] : 'Unknown'}
                            </p>
                            {doc.first_publish_year && (
                                <p className="search-result-year">
                                    {doc.first_publish_year}
                                </p>
                            )}
                        </div>
                        <button
                            className="secondary-btn small"
                            onClick={() => handleAddBook(doc)}
                        >
                            + Add
                        </button>
                    </div>
                ))}
            </div>

            {!isLoading && results.length === 0 && query && !error && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
                    No results found.
                </div>
            )}
        </div>
    );
};
