import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { type Book } from '../../types/book';
import { bookService } from '../../services/bookService';

interface MetadataRefreshModalProps {
    isOpen: boolean;
    onClose: () => void;
    book?: Book; // If provided, only refreshes this book
    onRefreshComplete?: () => void;
}

interface UpdatedBookRecord {
    id: number;
    title: string;
    status: 'success' | 'failed';
    message?: string;
}

export const MetadataRefreshModal: React.FC<MetadataRefreshModalProps> = ({
    isOpen,
    onClose,
    book,
    onRefreshComplete
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState<string>('');
    const [refreshResult, setRefreshResult] = useState<any>(null);
    const [showResultsList, setShowResultsList] = useState(false);

    // Results tracking
    const [updatedBooks, setUpdatedBooks] = useState<UpdatedBookRecord[]>([]);

    // Progress State
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0
    });
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [eta, setEta] = useState<number | null>(null);

    // Refs
    const abortRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setUpdatedBooks([]);
            setShowResultsList(false);
            setRefreshResult(null);
            setProgress(0);
            setStats({ total: 0, processed: 0, success: 0, failed: 0, skipped: 0 });
            setElapsedTime(0);
            setEta(null);
            abortRef.current = false;
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen]);

    // Timer logic
    useEffect(() => {
        if (isRefreshing && startTime) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRefreshing, startTime]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = () => {
        abortRef.current = true;
        setRefreshStatus('Stopping...');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setRefreshStatus('Initializing...');
        setStartTime(Date.now());
        setElapsedTime(0);
        setEta(null);
        setProgress(0);
        setRefreshResult(null);
        setUpdatedBooks([]);
        abortRef.current = false;

        try {
            if (book) {
                // Single book refresh
                setStats({ total: 1, processed: 0, success: 0, failed: 0, skipped: 0 });
                setRefreshStatus(`Fetching metadata for "${book.title}"...`);

                await bookService.refreshBookMetadata(book.id);
                setUpdatedBooks([{ id: book.id, title: book.title, status: 'success', message: 'Updated' }]);

                setProgress(100);
                setStats({ total: 1, processed: 1, success: 1, failed: 0, skipped: 0 });
                setRefreshStatus('Metadata refresh completed');
                setRefreshResult({ success: true, message: 'Updated successfully' });
            } else {
                // Bulk refresh logic
                setRefreshStatus('Fetching book list...');
                const allBooks = await bookService.getBooks();
                const total = allBooks.length;
                setStats({ total, processed: 0, success: 0, failed: 0, skipped: 0 });

                let processed = 0;
                let success = 0;
                let failed = 0;
                const batchStartTime = Date.now();
                const newUpdatedBooks: UpdatedBookRecord[] = [];

                for (const b of allBooks) {
                    if (abortRef.current) {
                        setRefreshStatus('Process stopped by user.');
                        break;
                    }

                    setRefreshStatus(`Processing: ${b.title}...`);

                    try {
                        const res = await bookService.refreshBookMetadata(b.id);
                        if (res.success) {
                            success++;
                            newUpdatedBooks.push({ id: b.id, title: b.title, status: 'success' });
                        } else {
                            failed++;
                            newUpdatedBooks.push({ id: b.id, title: b.title, status: 'failed', message: 'Failed' });
                        }
                    } catch (e: any) {
                        console.error(e);
                        failed++;
                        newUpdatedBooks.push({ id: b.id, title: b.title, status: 'failed', message: e.message || 'Error' });
                    }

                    processed++;
                    const currentProgress = (processed / total) * 100;
                    setProgress(currentProgress);
                    setStats(prev => ({ ...prev, processed, success, failed }));
                    setUpdatedBooks([...newUpdatedBooks]); // Update live list (maybe debounce if needed for perf)

                    // Calculate ETA
                    const now = Date.now();
                    const timeSpent = (now - batchStartTime) / 1000;
                    const rate = timeSpent / processed;
                    const remaining = total - processed;
                    setEta(Math.floor(rate * remaining));

                    // Small delay to allow UI updates and not block thread completely
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                setRefreshStatus(abortRef.current ? 'Stopped.' : `Completed! Updated: ${success}, Failed: ${failed}`);
                setRefreshResult({
                    success: true,
                    message: abortRef.current ? 'Process stopped' : 'Batch process complete',
                    wasStopped: abortRef.current
                });
            }

            if (onRefreshComplete) {
                // Don't auto close if we want to show results
            }
        } catch (error: any) {
            console.error('Error refreshing metadata:', error);
            setRefreshStatus(error.response?.data?.error || 'Failed to refresh metadata');
            setRefreshResult({ success: false, error: error.message });
        } finally {
            setIsRefreshing(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleClose = () => {
        if (isRefreshing) {
            if (confirm('Process is running. Stop and close?')) {
                handleStop();
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="🔄 Refresh Metadata">
            <div style={{ minWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                {!showResultsList ? (
                    <>
                        {/* Initial / Progress View */}
                        {!isRefreshing && !refreshResult && (
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    {book
                                        ? `Refresh metadata for "${book.title}"?`
                                        : "This will fetch updated metadata (covers, descriptions, etc.) for all books in your library from Google Books."
                                    }
                                </p>
                                {!book && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'rgba(255, 165, 0, 0.1)',
                                        border: '1px solid rgba(255, 165, 0, 0.3)',
                                        borderRadius: '6px',
                                        marginTop: '10px',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        ⚠️ This process may take a while depending on your library size.
                                    </div>
                                )}
                            </div>
                        )}

                        {(isRefreshing || refreshResult) && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span>{refreshStatus}</span>
                                    <span>{stats.processed} / {stats.total}</span>
                                </div>

                                <div style={{
                                    height: '10px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '5px',
                                    overflow: 'hidden',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                                        transition: 'width 0.3s ease-out'
                                    }} />
                                </div>

                                {!book && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        background: 'var(--glass-bg)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Time Elapsed</span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>{formatTime(elapsedTime)}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Est. Remaining</span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                                {eta !== null ? formatTime(eta) : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Updated Preview (Last 3) */}
                        {isRefreshing && updatedBooks.length > 0 && (
                            <div style={{ marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <div style={{ marginBottom: '5px' }}>Recently Processed:</div>
                                {updatedBooks.slice(-3).reverse().map(b => (
                                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span>{b.status === 'success' ? '✅' : '❌'}</span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{b.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            {!isRefreshing && !refreshResult && (
                                <button
                                    onClick={handleRefresh}
                                    className="primary-btn"
                                    style={{ flex: 1 }}
                                >
                                    {book ? 'Refresh Book' : 'Start Bulk Refresh'}
                                </button>
                            )}

                            {isRefreshing && (
                                <button
                                    onClick={handleStop}
                                    className="secondary-btn"
                                    style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                                >
                                    🛑 Stop
                                </button>
                            )}

                            {refreshResult && !book && (
                                <button
                                    onClick={() => setShowResultsList(true)}
                                    className="primary-btn"
                                    style={{ flex: 1 }}
                                >
                                    📋 Show Updated Books ({updatedBooks.length})
                                </button>
                            )}

                            <button
                                onClick={handleClose}
                                className="secondary-btn"
                                style={{ flex: 1 }}
                                disabled={isRefreshing}
                            >
                                {refreshResult ? 'Close' : 'Cancel'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Results List View */}
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Update Results</h4>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#4ade80' }}>✅ Success: {stats.success}</span>
                                <span style={{ color: '#ef4444' }}>❌ Failed: {stats.failed}</span>
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            background: 'var(--glass-bg)',
                            borderRadius: '8px',
                            padding: '10px',
                            marginBottom: '15px',
                            minHeight: '200px'
                        }}>
                            {updatedBooks.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No updates recorded.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {updatedBooks.map(b => (
                                        <div key={b.id} style={{
                                            padding: '8px',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.03)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                <span>{b.status === 'success' ? '✅' : '❌'}</span>
                                                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
                                            </div>
                                            {b.message && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.message}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowResultsList(false)}
                                className="secondary-btn"
                                style={{ flex: 1 }}
                            >
                                ⬅️ Back
                            </button>
                            <button
                                onClick={() => { onRefreshComplete?.(); onClose(); }}
                                className="primary-btn"
                                style={{ flex: 1 }}
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
