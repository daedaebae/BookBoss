import React from 'react';
import { type Shelf } from '../../types/shelf';

export interface SidebarFilter {
    type: 'all' | 'status' | 'format' | 'shelf' | 'series' | 'loaned' | 'user';
    value?: string;
    shelfId?: number;
    userId?: number;
}

interface SidebarProps {
    activeFilter: SidebarFilter;
    onFilterChange: (filter: SidebarFilter) => void;
    shelves: Shelf[];
    seriesList: string[];
    onManageShelves: () => void;
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
    // New prop for user libraries
    publicLibraries?: { id: number; username: string; library_name?: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeFilter,
    onFilterChange,
    shelves,
    seriesList,
    onManageShelves,
    bookCounts,
    isMobileOpen = false,
    onMobileClose,
    onToggleSidebar,
    isVisible = true,
    user,
    onLogout,
    onSettingsClick,
    publicLibraries = []
}) => {
    // State for collapsible sections
    const [isLibrariesOpen, setIsLibrariesOpen] = React.useState(true);

    const isActive = (type: string, value?: string | number) => {
        if (type === 'user') return activeFilter.type === 'user' && activeFilter.userId === value;
        return activeFilter.type === type && activeFilter.value === value;
    };

    const handleFilterClick = (filter: SidebarFilter) => {
        onFilterChange(filter);
        onMobileClose?.();
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onMobileClose}
                />
            )}

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`} style={{ display: isVisible ? 'flex' : 'none', flexDirection: 'column' }}>
                {/* Sidebar Header */}
                <div className="sidebar-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(to right, var(--title-gradient-start), var(--title-gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            BookBoss {import.meta.env.DEV && <span style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>(Dev)</span>}
                        </h2>
                        {user && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {user.username}
                            </p>
                        )}
                    </div>
                    {onToggleSidebar && (
                        <button
                            className="secondary-btn small"
                            onClick={onToggleSidebar}
                            title="Hide Sidebar"
                            style={{ padding: '4px 8px', height: 'fit-content' }}
                        >
                            ◀
                        </button>
                    )}
                </div>



                <div className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>

                    {/* Main Navigation */}
                    <div className="sidebar-section">
                        <button
                            className={`sidebar-item ${isActive('all') && !window.location.pathname.includes('features') ? 'active' : ''}`}
                            onClick={() => {
                                if (window.location.pathname !== '/') {
                                    window.location.href = '/';
                                }
                                handleFilterClick({ type: 'all' });
                            }}
                        >
                            <span className="sidebar-icon">📚</span>
                            <span className="sidebar-label">My Library</span>
                            <span className="sidebar-count">{bookCounts.total}</span>
                        </button>

                        <button
                            className={`sidebar-item ${window.location.pathname.includes('features') ? 'active' : ''}`}
                            onClick={() => {
                                window.location.href = '/features';
                                onMobileClose?.();
                            }}
                        >
                            <span className="sidebar-icon">💡</span>
                            <span className="sidebar-label">Suggest a Change!</span>
                        </button>

                        {/* NEW HELP BUTTON (Links to User Wiki) */}
                        <a
                            href="https://daedaebae.github.io/BookBoss/User-Wiki/1-Getting-Started.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-item"
                            style={{
                                textDecoration: 'none',
                                marginTop: '10px',
                                border: '2px dashed var(--accent-color)',
                                background: 'rgba(var(--accent-color-rgb), 0.1)'
                            }}
                        >
                            <span className="sidebar-icon" style={{ animation: 'bounce 2s infinite' }}>🧭</span>
                            <span className="sidebar-label" style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>User Guide / Help!</span>
                        </a>
                    </div>

                    {/* Libraries Section (Collapsible) */}
                    <div className="sidebar-section">
                        <div
                            className="sidebar-section-title"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                            onClick={() => setIsLibrariesOpen(!isLibrariesOpen)}
                        >
                            <span>Shared Libraries</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{isLibrariesOpen ? '▼' : '▶'}</span>
                        </div>

                        {isLibrariesOpen && (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                {publicLibraries.length > 0 ? (
                                    publicLibraries.sort((a, b) => (a.library_name || a.username).localeCompare(b.library_name || b.username)).map(lib => {
                                        const displayName = lib.library_name || `${lib.username}'s Library`;
                                        return (
                                            <button
                                                key={lib.id}
                                                className={`sidebar-item ${isActive('user', lib.id) ? 'active' : ''}`}
                                                onClick={() => handleFilterClick({ type: 'user', userId: lib.id })}
                                                title={displayName}
                                                style={{
                                                    paddingLeft: '16px',
                                                    paddingTop: '12px',
                                                    paddingBottom: '12px',
                                                    gap: '12px'
                                                }}
                                            >
                                                <span className="sidebar-icon" style={{
                                                    fontSize: '1rem',
                                                    background: 'var(--glass-border)',
                                                    borderRadius: '6px',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '0', // handled by gap
                                                    flexShrink: 0,
                                                    fontWeight: 600,
                                                    color: 'var(--accent-color)'
                                                }}>
                                                    {getInitials(lib.username)}
                                                </span>
                                                <span className="sidebar-label" style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontSize: '1rem',
                                                    fontWeight: 500
                                                }}>
                                                    {displayName}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '4px 12px', fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>No shared libraries</div>
                                )}
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
                                        <span style={{
                                            marginLeft: '4px',
                                            color: 'var(--danger-color)',
                                            fontSize: '0.85em',
                                            fontWeight: 600
                                        }}>
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

                    {/* Shelves */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Shelves</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onManageShelves(); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.4rem',
                                    padding: '0 4px',
                                    color: 'var(--accent-color)',
                                    fontWeight: 'bold',
                                    lineHeight: 1
                                }}
                                title="Create Shelf"
                            >
                                +
                            </button>
                        </div>
                        {shelves.length > 0 ? (
                            shelves.map(shelf => (
                                <button
                                    key={shelf.id}
                                    className={`sidebar-item ${activeFilter.type === 'shelf' && activeFilter.shelfId === shelf.id ? 'active' : ''}`}
                                    onClick={() => handleFilterClick({ type: 'shelf', value: shelf.name, shelfId: shelf.id })}
                                >
                                    <span className="sidebar-icon">📚</span>
                                    <span className="sidebar-label">{shelf.name}</span>
                                </button>
                            ))
                        ) : (
                            <button
                                onClick={onManageShelves}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: '1px dashed var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'var(--accent-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginTop: '8px'
                                }}
                            >
                                + Create new shelf
                            </button>
                        )}
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
                <div className="sidebar-footer" style={{
                    marginTop: 'auto',
                    paddingTop: '15px',
                    borderTop: '1px solid var(--glass-border)',
                    flexShrink: 0
                }}>
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
            </aside >
        </>
    );
};
