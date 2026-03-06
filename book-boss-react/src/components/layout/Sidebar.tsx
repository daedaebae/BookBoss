import React from 'react';
import { type Shelf } from '../../types/shelf';
import { shelfService } from '../../services/shelfService';
import { bookService } from '../../services/bookService';

export interface SidebarFilter {
    type: 'all' | 'status' | 'format' | 'shelf' | 'series' | 'loaned' | 'user' | 'library';
    value?: string;
    shelfId?: number;
    userId?: number;
}

interface SidebarProps {
    activeFilter: SidebarFilter;
    onFilterChange: (filter: SidebarFilter) => void;
    shelves: Shelf[];
    seriesList: string[];
    onShelvesChanged: () => void;
    onLibrariesChanged: () => void;
    bookCounts: {
        total: number;
        notStarted: number;
        inProgress: number;
        completed: number;
        dnf: number;
        physical: number;
        ebook: number;
        audiobook: number;
        loaned: number;
        overdue: number;
    };
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    onToggleSidebar?: () => void;
    isVisible?: boolean;
    user?: any;
    onLogout?: () => void;
    onSettingsClick?: () => void;
    userLibraries?: string[];
}

// ── inline mini-prompt ────────────────────────────────────────────────────────
function InlineInput({
    placeholder,
    defaultValue = '',
    onConfirm,
    onCancel,
}: {
    placeholder: string;
    defaultValue?: string;
    onConfirm: (val: string) => void;
    onCancel: () => void;
}) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
            <input
                autoFocus
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && val.trim()) onConfirm(val.trim());
                    if (e.key === 'Escape') onCancel();
                }}
                style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--accent-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                }}
            />
            <button
                onClick={() => val.trim() && onConfirm(val.trim())}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 700 }}
            >✓</button>
            <button
                onClick={onCancel}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
            >✕</button>
        </div>
    );
}

// ── icon button helper ─────────────────────────────────────────────────────────
function IconBtn({ title, onClick, children }: { title: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode }) {
    return (
        <button
            title={title}
            onClick={(e) => { e.stopPropagation(); onClick(e); }}
            style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0, transition: 'opacity 0.15s',
            }}
            className="action-btn"
        >
            {children}
        </button>
    );
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeFilter,
    onFilterChange,
    shelves,
    seriesList,
    onShelvesChanged,
    onLibrariesChanged,
    bookCounts,
    isMobileOpen = false,
    onMobileClose,
    onToggleSidebar,
    isVisible = true,
    user,
    onLogout,
    onSettingsClick,
    userLibraries = [],
}) => {
    const [isLibrariesOpen, setIsLibrariesOpen] = React.useState(true);
    const [expandedLibraries, setExpandedLibraries] = React.useState<Set<string>>(new Set());
    const [error, setError] = React.useState<string | null>(null);
    const [randomGreeting, setRandomGreeting] = React.useState('Welcome back');
    const [githubVersion, setGithubVersion] = React.useState<string>(APP_VERSION);
    const [githubReleaseUrl, setGithubReleaseUrl] = React.useState<string>(
        'https://github.com/daedaebae/BookBoss/releases'
    );

    React.useEffect(() => {
        const greetings = [
            "Welcome back",
            "Time for another chapter",
            "Ready to read",
            "Lost in a book",
            "Hello there",
            "Your next page awaits",
            "Welcome to your library"
        ];
        setRandomGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, []);

    React.useEffect(() => {
        fetch('https://api.github.com/repos/daedaebae/BookBoss/releases/latest')
            .then(r => r.json())
            .then(data => {
                if (data?.tag_name) {
                    setGithubVersion(data.tag_name.replace(/^v/, ''));
                    setGithubReleaseUrl(data.html_url);
                }
            })
            .catch(() => { /* fall back to build-time APP_VERSION */ });
    }, []);

    // UI editing state
    const [creatingLibrary, setCreatingLibrary] = React.useState(false);
    const [renamingLibrary, setRenamingLibrary] = React.useState<string | null>(null);

    const [creatingShelfUnder, setCreatingShelfUnder] = React.useState<string | null>(null); // libraryName
    const [renamingShelf, setRenamingShelf] = React.useState<Shelf | null>(null);

    const clearError = () => setError(null);

    // Parse privacy settings
    let isLibraryShared = false;
    try {
        if (user?.privacy_settings) {
            const privacy = typeof user.privacy_settings === 'string'
                ? JSON.parse(user.privacy_settings)
                : user.privacy_settings;
            isLibraryShared = !!privacy.share_library;
        }
    } catch { /* */ }

    const isActive = (type: string, value?: string | number) => {
        if (type === 'user') return activeFilter.type === 'user' && activeFilter.userId === value;
        return activeFilter.type === type && activeFilter.value === value;
    };

    const handleFilterClick = (filter: SidebarFilter) => {
        onFilterChange(filter);
        onMobileClose?.();
    };

    const toggleLibrary = (lib: string) => {
        setExpandedLibraries(prev => {
            const next = new Set(prev);
            if (next.has(lib)) next.delete(lib); else next.add(lib);
            return next;
        });
    };

    // ── library CRUD ──────────────────────────────────────────────────────────
    const handleCreateLibrary = async (name: string) => {
        setCreatingLibrary(false);
        // Libraries are just a 'library' tag on books. Creating one means the user
        // will assign it via Edit Book. We just expand the "empty" sub-menu.
        // If there are genuinely no books yet, nothing happens visually until a book is assigned.
        // Here we treat it as selecting the (empty) library filter to signal intent.
        handleFilterClick({ type: 'library', value: name });
    };

    const handleRenameLibrary = async (oldName: string, newName: string) => {
        setRenamingLibrary(null);
        try {
            await bookService.renameLibrary(oldName, newName);
            onLibrariesChanged();
            // If the active filter was this library, update it
            if (activeFilter.type === 'library' && activeFilter.value === oldName) {
                onFilterChange({ type: 'library', value: newName });
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to rename library');
        }
    };

    const handleDeleteLibrary = async (name: string) => {
        if (!confirm(`Remove library "${name}"? Books will keep their existing library tag value but the library will no longer appear in the sidebar. This cannot be undone.`)) return;
        try {
            await bookService.deleteLibrary(name);
            onLibrariesChanged();
            if (activeFilter.type === 'library' && activeFilter.value === name) {
                onFilterChange({ type: 'all' });
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to delete library');
        }
    };

    // ── shelf CRUD ────────────────────────────────────────────────────────────
    const handleCreateShelf = async (name: string) => {
        setCreatingShelfUnder(null);
        try {
            await shelfService.createShelf(name);
            onShelvesChanged();
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to create shelf');
        }
    };

    const handleRenameShelf = async (shelf: Shelf, newName: string) => {
        setRenamingShelf(null);
        try {
            await shelfService.renameShelf(shelf.id, newName);
            onShelvesChanged();
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to rename shelf');
        }
    };

    const handleDeleteShelf = async (shelf: Shelf) => {
        if (!confirm(`Delete shelf "${shelf.name}"? Books will not be deleted.`)) return;
        try {
            await shelfService.deleteShelf(shelf.id);
            onShelvesChanged();
            if (activeFilter.type === 'shelf' && activeFilter.shelfId === shelf.id) {
                onFilterChange({ type: 'all' });
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to delete shelf');
        }
    };

    const sortedLibraries = [...userLibraries].sort((a, b) => a.localeCompare(b));

    return (
        <>
            {/* Global CSS for hover-reveal action buttons */}
            <style>{`
                .lib-row:hover .action-btn,
                .shelf-row:hover .action-btn { opacity: 1 !important; }
            `}</style>

            {isMobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`} style={{ display: isVisible ? 'flex' : 'none', flexDirection: 'column' }}>
                {/* Sidebar Header */}
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexShrink: 0, paddingBottom: 0 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img src="/logo.jpg" alt="BookBoss Logo" style={{ height: '180px', width: 'auto', objectFit: 'contain', marginBottom: '5px' }} />
                        {import.meta.env.DEV && <span style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>(Dev)</span>}
                        {user && (
                            <p
                                className="welcome-greeting"
                                style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)',
                                    marginTop: '8px',
                                    marginBottom: '15px',
                                    textAlign: 'center',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    animation: 'fadeInUp 0.8s ease-out'
                                }}
                            >
                                {randomGreeting}, {user.username}!
                            </p>
                        )}
                    </div>
                    {onToggleSidebar && (
                        <button className="secondary-btn small" onClick={onToggleSidebar} title="Hide Sidebar" style={{ position: 'absolute', top: '15px', right: '15px', padding: '4px 8px' }}>◀</button>
                    )}
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{ margin: '4px 8px', padding: '6px 10px', background: 'var(--danger-color)', color: '#fff', borderRadius: 6, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{error}</span>
                        <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>
                )}

                <div className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>

                    {/* Main Navigation */}
                    <div className="sidebar-section">
                        <button
                            className={`sidebar-item ${isActive('all') && !window.location.pathname.includes('features') && activeFilter.type !== 'library' ? 'active' : ''}`}
                            onClick={() => {
                                if (window.location.pathname !== '/') window.location.href = '/';
                                handleFilterClick({ type: 'all' });
                            }}
                        >
                            <span className="sidebar-icon">📚</span>
                            <span className="sidebar-label">All Books</span>
                            <span className="sidebar-count">{bookCounts.total}</span>
                        </button>

                        <button
                            className={`sidebar-item ${window.location.pathname.includes('features') ? 'active' : ''}`}
                            onClick={() => { window.location.href = '/features'; onMobileClose?.(); }}
                        >
                            <span className="sidebar-icon">💡</span>
                            <span className="sidebar-label">Bug report/Feature request</span>
                        </button>

                        <a
                            href="https://daedaebae.github.io/BookBoss/User-Wiki/1-Getting-Started.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-item"
                            style={{ textDecoration: 'none', marginTop: '10px', border: '2px dashed var(--accent-color)', background: 'rgba(var(--accent-color-rgb), 0.1)' }}
                        >
                            <span className="sidebar-icon" style={{ animation: 'bounce 2s infinite' }}>🧭</span>
                            <span className="sidebar-label" style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>User Guide / Help!</span>
                        </a>
                    </div>

                    {/* ── My Libraries (with shelves as sub-items) ──────────────────── */}
                    <div className="sidebar-section">
                        <div
                            className="sidebar-section-title"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setIsLibrariesOpen(!isLibrariesOpen)}
                        >
                            <span>My Libraries</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                <button
                                    title="New Library"
                                    onClick={() => setCreatingLibrary(true)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--accent-color)', lineHeight: 1, padding: '0 2px' }}
                                >+</button>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{isLibrariesOpen ? '▼' : '▶'}</span>
                            </div>
                        </div>

                        {isLibrariesOpen && (
                            <div style={{ paddingRight: 4 }}>
                                {/* Create new library input */}
                                {creatingLibrary && (
                                    <div style={{ padding: '0 4px' }}>
                                        <InlineInput
                                            placeholder="Library name…"
                                            onConfirm={(name) => handleCreateLibrary(name)}
                                            onCancel={() => setCreatingLibrary(false)}
                                        />
                                    </div>
                                )}

                                {sortedLibraries.length === 0 && !creatingLibrary && (
                                    <div style={{ padding: '4px 12px', fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>No custom libraries</div>
                                )}

                                {sortedLibraries.map(libName => {
                                    const isExpanded = expandedLibraries.has(libName);
                                    const libShelves = shelves; // shelves don't have a library field; show all under each lib

                                    return (
                                        <div key={libName}>
                                            {/* Library row */}
                                            {renamingLibrary === libName ? (
                                                <div style={{ padding: '0 4px' }}>
                                                    <InlineInput
                                                        placeholder="New name…"
                                                        defaultValue={libName}
                                                        onConfirm={(name) => handleRenameLibrary(libName, name)}
                                                        onCancel={() => setRenamingLibrary(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`sidebar-item lib-row ${isActive('library', libName) ? 'active' : ''}`}
                                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => handleFilterClick({ type: 'library', value: libName })}
                                                    title={libName}
                                                >
                                                    {/* expand shelves toggle */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleLibrary(libName); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', opacity: 0.6, padding: '0 4px 0 0', flexShrink: 0 }}
                                                    >{isExpanded ? '▼' : '▶'}</button>
                                                    <span className="sidebar-icon">📚</span>
                                                    <span className="sidebar-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                        {libName}
                                                    </span>
                                                    {isLibraryShared && <span title="Shared" style={{ fontSize: '0.9rem', opacity: 0.7 }}>👥</span>}
                                                    {/* action buttons (visible on hover) */}
                                                    <IconBtn title="Rename library" onClick={() => setRenamingLibrary(libName)}>✏️</IconBtn>
                                                    <IconBtn title="Delete library" onClick={() => handleDeleteLibrary(libName)}>🗑️</IconBtn>
                                                </div>
                                            )}

                                            {/* Shelf sub-list */}
                                            {isExpanded && (
                                                <div style={{ paddingLeft: 20 }}>
                                                    {/* Add shelf button */}
                                                    {creatingShelfUnder === libName ? (
                                                        <div style={{ padding: '0 4px' }}>
                                                            <InlineInput
                                                                placeholder="Shelf name…"
                                                                onConfirm={(name) => handleCreateShelf(name)}
                                                                onCancel={() => setCreatingShelfUnder(null)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setCreatingShelfUnder(libName); }}
                                                            style={{
                                                                width: '100%', textAlign: 'left', padding: '4px 8px',
                                                                background: 'none', border: '1px dashed var(--glass-border)',
                                                                borderRadius: 6, color: 'var(--accent-color)', cursor: 'pointer',
                                                                fontSize: '0.8rem', marginBottom: 4
                                                            }}
                                                        >+ New shelf</button>
                                                    )}

                                                    {libShelves.length === 0 && !creatingShelfUnder && (
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', padding: '2px 8px' }}>No shelves</div>
                                                    )}

                                                    {libShelves.map(shelf => (
                                                        <div key={shelf.id}>
                                                            {renamingShelf?.id === shelf.id ? (
                                                                <div style={{ padding: '0 4px' }}>
                                                                    <InlineInput
                                                                        placeholder="New name…"
                                                                        defaultValue={shelf.name}
                                                                        onConfirm={(name) => handleRenameShelf(shelf, name)}
                                                                        onCancel={() => setRenamingShelf(null)}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={`sidebar-item shelf-row ${activeFilter.type === 'shelf' && activeFilter.shelfId === shelf.id ? 'active' : ''}`}
                                                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                    onClick={() => handleFilterClick({ type: 'shelf', value: shelf.name, shelfId: shelf.id })}
                                                                >
                                                                    <span className="sidebar-icon" style={{ fontSize: '0.85rem' }}>🔖</span>
                                                                    <span className="sidebar-label" style={{ flex: 1, fontSize: '0.85rem' }}>{shelf.name}</span>
                                                                    <IconBtn title="Rename shelf" onClick={() => setRenamingShelf(shelf)}>✏️</IconBtn>
                                                                    <IconBtn title="Delete shelf" onClick={() => handleDeleteShelf(shelf)}>🗑️</IconBtn>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Reading Status */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Reading Status</div>
                        {[
                            { val: 'Not Started', icon: '⭕', label: 'Not Started', count: bookCounts.notStarted },
                            { val: 'In Progress', icon: '📗', label: 'In Progress', count: bookCounts.inProgress },
                            { val: 'Completed', icon: '✅', label: 'Completed', count: bookCounts.completed },
                            { val: 'DNF', icon: '⛔', label: 'Did Not Finish', count: bookCounts.dnf },
                        ].map(status => (
                            <button
                                key={status.val}
                                className={`sidebar-item ${isActive('status', status.val) ? 'active' : ''}`}
                                onClick={() => handleFilterClick({ type: 'status', value: status.val })}
                            >
                                <span className="sidebar-icon">{status.icon}</span>
                                <span className="sidebar-label">{status.label}</span>
                                <span className="sidebar-count">{status.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Loaned Books */}
                    {bookCounts.loaned > 0 && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Loans</div>
                            <button
                                className={`sidebar-item ${isActive('loaned') ? 'active' : ''}`}
                                onClick={() => handleFilterClick({ type: 'loaned' })}
                            >
                                <span className="sidebar-icon">📤</span>
                                <span className="sidebar-label">
                                    Loaned Out
                                    {bookCounts.overdue > 0 && (
                                        <span style={{ marginLeft: '4px', color: 'var(--danger-color)', fontSize: '0.85em', fontWeight: 600 }}>
                                            (! {bookCounts.overdue})
                                        </span>
                                    )}
                                </span>
                                <span className="sidebar-count">{bookCounts.loaned}</span>
                            </button>
                        </div>
                    )}

                    {/* Format */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Format</div>
                        {[
                            { val: 'Physical', icon: '📖', label: 'Physical', count: bookCounts.physical },
                            { val: 'Ebook', icon: '💻', label: 'Ebook', count: bookCounts.ebook },
                            { val: 'Audiobook', icon: '🎧', label: 'Audiobook', count: bookCounts.audiobook },
                        ].map(fmt => (
                            <button
                                key={fmt.val}
                                className={`sidebar-item ${isActive('format', fmt.val) ? 'active' : ''}`}
                                onClick={() => handleFilterClick({ type: 'format', value: fmt.val })}
                            >
                                <span className="sidebar-icon">{fmt.icon}</span>
                                <span className="sidebar-label">{fmt.label}</span>
                                <span className="sidebar-count">{fmt.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Series */}
                    {seriesList.length > 0 && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Series</div>
                            {seriesList.map(series => (
                                <button
                                    key={series}
                                    className={`sidebar-item ${isActive('series', series) ? 'active' : ''}`}
                                    onClick={() => handleFilterClick({ type: 'series', value: series })}
                                >
                                    <span className="sidebar-icon">📖</span>
                                    <span className="sidebar-label">{series}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* System Section - Sticky Footer */}
                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
                    {onSettingsClick && (
                        <button className="sidebar-item" onClick={() => { onSettingsClick(); onMobileClose?.(); }}>
                            <span className="sidebar-icon">⚙️</span>
                            <span className="sidebar-label">Settings</span>
                        </button>
                    )}
                    {onLogout && (
                        <button className="sidebar-item" onClick={onLogout}>
                            <span className="sidebar-icon">🚪</span>
                            <span className="sidebar-label">Logout</span>
                        </button>
                    )}
                </div>
            </aside>
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '15px',
                color: 'var(--text-secondary)',
                opacity: 0.3,
                fontSize: '0.8rem',
                zIndex: 1000
            }}>
                <a
                    href={githubReleaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                    title={`View changelog for v${githubVersion}`}
                >
                    v{githubVersion}
                </a>
            </div>
        </>
    );
};
