import React, { useState } from 'react';
import type { Book } from '../../types/book';

interface BookSearchProps {
    onBookSelect: (book: Partial<Book>) => void;
}

export const BookSearch: React.FC<BookSearchProps> = ({ onBookSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const searchBooks = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
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
            searchBooks();
        }
    };

    const handleAddBook = (doc: any) => {
        const coverId = doc.cover_i;
        const book: Partial<Book> = {
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            isbn: doc.isbn ? doc.isbn[0] : '',
            cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
            categories: doc.subject ? doc.subject.slice(0, 5) : [],
            publication_date: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
            library: 'Main Library',
            format: 'Physical',
            binding_type: 'Paperback',
            status: 'Not Started',
            added_at: new Date().toISOString()
        };
        onBookSelect(book);
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
                    onClick={searchBooks}
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

            <div className="search-results" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '20px',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '10px'
            }}>
                {results.map((doc, index) => (
                    <div key={doc.key || index} className="book-card" style={{
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{
                            height: '200px',
                            background: 'var(--glass-bg)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {doc.cover_i ? (
                                <img
                                    src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`}
                                    alt={doc.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{ fontSize: '2rem' }}>📚</span>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.title}>
                                {doc.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {doc.author_name ? doc.author_name[0] : 'Unknown'}
                            </p>
                            {doc.first_publish_year && (
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {doc.first_publish_year}
                                </p>
                            )}
                        </div>
                        <button
                            className="secondary-btn small"
                            onClick={() => handleAddBook(doc)}
                            style={{ width: '100%' }}
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
