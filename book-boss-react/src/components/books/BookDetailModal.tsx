import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { type Shelf } from '../../types/shelf';
import { getSafeCoverUrl } from '../../utils/coverUrlGuard';
import { PhotoGalleryModal } from '../photos/PhotoGalleryModal';
import { StarRating } from '../common/StarRating';
import { absService, type AbsSearchResult } from '../../services/absService';
import { bookService } from '../../services/bookService';

interface BookDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
    shelves?: Shelf[];
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
    onRead: (book: Book) => void;
    onAddToShelf?: (bookId: number, shelfId: number) => void;
    onUpdateProgress?: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
    isOpen,
    onClose,
    book,
    shelves = [],
    onEdit,
    onDelete,
    onRead,
    onAddToShelf,
    onUpdateProgress
}) => {
    const [showShelfSelect, setShowShelfSelect] = useState(false);
    const [showPhotoGallery, setShowPhotoGallery] = useState(false);
    const [localRating, setLocalRating] = useState<number | undefined>(undefined);

    const handleRatingChange = async (newRating: number) => {
        if (!book) return;
        setLocalRating(newRating);
        try {
            await bookService.updateBook(book.id, { rating: newRating });
        } catch (error) {
            console.error('Failed to update rating:', error);
            setLocalRating(undefined);
        }
    };

    // ABS Linking
    const [isLinking, setIsLinking] = useState(false);
    const [linkSearchQuery, setLinkSearchQuery] = useState('');
    const [linkSearchResults, setLinkSearchResults] = useState<AbsSearchResult[]>([]);

    const handleLinkSearch = async () => {
        if (!linkSearchQuery.trim()) return;
        try {
            const results = await absService.search(linkSearchQuery);
            setLinkSearchResults(results);
        } catch (error) {
            console.error('Link Search Error:', error);
        }
    };

    const handleLink = async (item: AbsSearchResult) => {
        if (!book) return;
        try {
            await absService.linkBook(book.id, item);
            setIsLinking(false);
            // We should ideally reload the book or update local state
            // For now, let's close the search; the parent might need to refresh data
            // If onEdit triggers a refresh, we could call it? 
            // Better: call onEdit with updated book? No, that opens edit modal.
            // We just updated the backend. If we close and reopen, it will be there.
            // But for UX, let's try to update locally if possible, or trigger refresh.
            // Since we don't have a refresh callback, we'll rely on the user refreshing or reopening.
            // Or maybe onClose then reopen? No.
            // Let's just reset UI and maybe alert success.
            onClose(); // Force close to refresh list when reopened
        } catch (error) {
            console.error('Link Error:', error);
        }
    };

    const handleUnlink = async () => {
        if (!book) return;
        if (!window.confirm('Are you sure you want to unlink from Audiobookshelf?')) return;
        try {
            await absService.unlinkBook(book.id);
            onClose(); // Force close to refresh
        } catch (error) {
            console.error('Unlink Error:', error);
        }
    };

    if (!book) return null;

    const coverUrl = getSafeCoverUrl(book);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Book Details" className="book-details" maxWidth="98vw">
                <div className="book-detail-layout">
                    {/* Left Column: Large Cover Image */}
                    <div className="book-cover-container">
                        <img
                            src={coverUrl}
                            alt={book.title}
                            className="book-cover-large"
                            onError={(e) => {
                                e.currentTarget.src = '/no_cover.png';
                            }}
                        />
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="book-info-column">
                        <div>
                            <h2 className="book-title">{book.title}</h2>
                            <h3 className="book-author">{book.author}</h3>

                            {book.series && (
                                <div className="book-series">
                                    {book.series} {book.series_order ? `#${book.series_order}` : ''}
                                </div>
                            )}
                        </div>

                        <div className="book-badges">
                            {book.status && (
                                <span className={`badge badge-status ${book.status.toLowerCase().replace(' ', '-')}`}>
                                    {book.status}
                                </span>
                            )}
                            {book.format && <span className="badge badge-format">{book.format}</span>}
                            {book.page_count && <span className="badge">📄 {book.page_count} pages</span>}
                        </div>

                        {/* Progress Bar if In Progress */}
                        {book.status === 'In Progress' && (
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${book.progress_percentage || (book.current_page && book.page_count ? (book.current_page / book.page_count * 100) : 0)}%`,
                                    background: `linear-gradient(90deg, 
                                    ${(book.progress_percentage || 0) < 50 ? '#fbbf24' :
                                            (book.progress_percentage || 0) < 80 ? '#f97316' : '#10b981'})`
                                }} />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.95rem', color: 'var(--text-secondary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {/* Dynamically show fields only if they have non-zero/non-empty data */}
                            {book.isbn && book.isbn !== '0' && (
                                <>
                                    <strong>ISBN:</strong> <span>{book.isbn}</span>
                                </>
                            )}
                            {book.series_index !== undefined && book.series_index !== 0 && (
                                <>
                                    <strong>Series Index:</strong> <span>{book.series_index}</span>
                                </>
                            )}
                            {book.publisher && (
                                <>
                                    <strong>Publisher:</strong> <span>{book.publisher}</span>
                                </>
                            )}
                            {book.language && (
                                <>
                                    <strong>Language:</strong> <span>{book.language.toUpperCase()}</span>
                                </>
                            )}
                            {book.categories && (
                                <>
                                    <strong>Categories:</strong> <span>{Array.isArray(book.categories) ? book.categories.join(', ') : book.categories}</span>
                                </>
                            )}
                            {book.publication_date && (
                                <>
                                    <strong>Published:</strong> <span>{new Date(book.publication_date).toLocaleDateString()}</span>
                                </>
                            )}
                            {book.added_at && (
                                <>
                                    <strong>Added:</strong> <span>{new Date(book.added_at).toLocaleDateString()}</span>
                                </>
                            )}
                            {book.library && (
                                <>
                                    <strong>Library:</strong> <span>{book.library}</span>
                                </>
                            )}
                            {book.shelf && (
                                <>
                                    <strong>Shelf:</strong> <span>{book.shelf}</span>
                                </>
                            )}
                            {book.physical_format && (
                                <>
                                    <strong>Format:</strong> <span>{book.physical_format}</span>
                                </>
                            )}
                            {book.book_condition && (
                                <>
                                    <strong>Condition:</strong> <span>{book.book_condition}</span>
                                </>
                            )}
                            {!!book.is_signed && (
                                <>
                                    <strong>Signed:</strong> <span>Yes ✍️</span>
                                </>
                            )}
                            {book.edition_type && (
                                <>
                                    <strong>Edition:</strong> <span>{book.edition_type}</span>
                                </>
                            )}
                            {book.edge_type && (
                                <>
                                    <strong>Edges:</strong> <span>{book.edge_type}</span>
                                </>
                            )}
                            {book.binding_details && (
                                <>
                                    <strong>Binding:</strong> <span>{book.binding_details}</span>
                                </>
                            )}
                            {!!book.has_bonus_chapters && (
                                <>
                                    <strong>Bonus:</strong> <span>Includes Bonus Chapters 📖</span>
                                </>
                            )}
                            {book.page_count && book.page_count > 0 && (
                                <>
                                    <strong>Pages:</strong> <span>{book.page_count}</span>
                                </>
                            )}
                        </div>

                        {book.description && (
                            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '5px' }}>Description</strong>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {book.description}
                                </p>
                            </div>
                        )}

                        {/* Loan Info */}
                        {book.is_loaned && (
                            <div style={{
                                padding: '15px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--accent-color)'
                            }}>
                                <strong>Loaned to:</strong> {book.borrower_name}
                                {book.due_date && (
                                    <div style={{ marginTop: '5px' }}>
                                        <strong>Due:</strong> {new Date(book.due_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Audiobookshelf Integration */}
                        <div style={{
                            padding: '15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            marginTop: '15px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Audiobookshelf</strong>
                                {book.abs_metadata ? (
                                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>● Linked</span>
                                ) : (
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>○ Not Linked</span>
                                )}
                            </div>

                            {book.abs_metadata ? (
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                        Linked to Item ID: {book.abs_metadata.libraryItemId}
                                    </div>
                                    <button
                                        className="secondary-btn small"
                                        onClick={() => handleUnlink()}
                                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                    >
                                        Unlink
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {!isLinking ? (
                                        <button
                                            className="secondary-btn small"
                                            onClick={() => setIsLinking(true)}
                                        >
                                            🔗 Link to Audiobookshelf
                                        </button>
                                    ) : (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search ABS..."
                                                    value={linkSearchQuery}
                                                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleLinkSearch()}
                                                    style={{ flex: 1, padding: '6px', fontSize: '0.9rem', borderRadius: '4px', border: 'none' }}
                                                />
                                                <button
                                                    onClick={() => handleLinkSearch()}
                                                    style={{ background: 'var(--accent-color)', border: 'none', color: 'white', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}
                                                >
                                                    🔍
                                                </button>
                                                <button
                                                    onClick={() => { setIsLinking(false); setLinkSearchResults([]); setLinkSearchQuery(''); }}
                                                    style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            {linkSearchResults.length > 0 && (
                                                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    {linkSearchResults.map(item => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleLink(item)}
                                                            style={{
                                                                padding: '8px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 600 }}>{item.media.metadata.title || item.name}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item._server.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Rating and Review Section */}
                        <div style={{
                            padding: '15px',
                            background: 'var(--glass-bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            marginTop: '15px'
                        }}>
                            <div style={{ marginBottom: book.notes ? '12px' : '0' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Your Rating:</strong>
                                <StarRating
                                    rating={localRating !== undefined ? localRating : (book.rating || 0)}
                                    size="large"
                                    onRatingChange={handleRatingChange}
                                />
                            </div>
                            {book.notes && (
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Your Review:</strong>
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.6',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere'
                                    }}>
                                        {book.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {(book.format === 'Ebook' || book.epub_file_path) && (
                                    <button
                                        className="primary-btn"
                                        onClick={() => onRead(book)}
                                        style={{ flex: 1 }}
                                    >
                                        📖 Read
                                    </button>
                                )}

                                {onUpdateProgress && book.status === 'In Progress' && (
                                    <button
                                        className="secondary-btn"
                                        onClick={() => onUpdateProgress(book)}
                                        style={{ flex: 1 }}
                                    >
                                        📈 Update Progress
                                    </button>
                                )}

                                {onAddToShelf && shelves.length > 0 && (
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <button
                                            className="secondary-btn"
                                            onClick={() => setShowShelfSelect(!showShelfSelect)}
                                            style={{ width: '100%' }}
                                        >
                                            📚 Add to Shelf
                                        </button>
                                        {showShelfSelect && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '8px',
                                                padding: '5px',
                                                marginBottom: '5px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                zIndex: 10
                                            }}>
                                                {shelves.map(shelf => (
                                                    <button
                                                        key={shelf.id}
                                                        onClick={() => {
                                                            onAddToShelf(book.id, shelf.id);
                                                            setShowShelfSelect(false);
                                                        }}
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            padding: '8px',
                                                            textAlign: 'left',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--text-primary)',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                    >
                                                        {shelf.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="secondary-btn"
                                    onClick={() => setShowPhotoGallery(true)}
                                    style={{ flex: 1 }}
                                >
                                    📸 View Photos
                                </button>

                                <button
                                    className="secondary-btn"
                                    onClick={() => onEdit(book)}
                                    style={{ flex: 1 }}
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    className="danger-btn"
                                    onClick={() => onDelete(book)}
                                    style={{ flex: 1 }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Photo Gallery Modal */}
            {book && (
                <PhotoGalleryModal
                    isOpen={showPhotoGallery}
                    onClose={() => setShowPhotoGallery(false)}
                    bookId={book.id}
                    bookTitle={book.title}
                />
            )}
        </>
    );
};
