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
    const isActive = (type: string, value?: string | number) => {
        if (type === 'user') return activeFilter.type === 'user' && activeFilter.userId === value;
        return activeFilter.type === type && activeFilter.value === value;
    };

    const handleFilterClick = (filter: SidebarFilter) => {
        onFilterChange(filter);
        onMobileClose?.();
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

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`} style={{ display: isVisible ? 'flex' : 'none' }}>
                {/* Sidebar Header */}
                <div className="sidebar-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(to right, var(--title-gradient-start), var(--title-gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            BookBoss {import.meta.env.DEV && <span style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>(Dev Mode)</span>}
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

                <div className="sidebar-nav">
                    {/* All Books */}
                    <div className="sidebar-section">
                        <button
                            className={`sidebar-item ${isActive('all') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'all' })}
                        >
                            <span className="sidebar-icon">📚</span>
                            <span className="sidebar-label">My Library</span>
                            <span className="sidebar-count">{bookCounts.total}</span>
                        </button>
                    </div>

                    {/* Libraries Section (New) */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Shared Libraries</div>
                        {publicLibraries.length > 0 ? (
                            publicLibraries.map(lib => (
                                <button
                                    key={lib.id}
                                    className={`sidebar-item ${isActive('user', lib.id) ? 'active' : ''}`}
                                    onClick={() => handleFilterClick({ type: 'user', userId: lib.id })}
                                >
                                    <span className="sidebar-icon">👤</span>
                                    <span className="sidebar-label">{lib.library_name || `${lib.username}'s Library`}</span>
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '4px 12px', fontSize: '0.8rem', opacity: 0.6 }}>No shared libraries</div>
                        )}
                    </div>

                    {/* Reading Status */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Reading Status</div>
                        <button
                            className={`sidebar-item ${isActive('status', 'Not Started') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'status', value: 'Not Started' })}
                        >
                            <span className="sidebar-icon">⭕</span>
                            <span className="sidebar-label">Not Started</span>
                            <span className="sidebar-count">{bookCounts.notStarted}</span>
                        </button>
                        <button
                            className={`sidebar-item ${isActive('status', 'In Progress') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'status', value: 'In Progress' })}
                        >
                            <span className="sidebar-icon">📗</span>
                            <span className="sidebar-label">In Progress</span>
                            <span className="sidebar-count">{bookCounts.inProgress}</span>
                        </button>
                        <button
                            className={`sidebar-item ${isActive('status', 'Completed') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'status', value: 'Completed' })}
                        >
                            <span className="sidebar-icon">✅</span>
                            <span className="sidebar-label">Completed</span>
                            <span className="sidebar-count">{bookCounts.completed}</span>
                        </button>
                        <button
                            className={`sidebar-item ${isActive('status', 'DNF') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'status', value: 'DNF' })}
                        >
                            <span className="sidebar-icon">⛔</span>
                            <span className="sidebar-label">Did Not Finish</span>
                            <span className="sidebar-count">{bookCounts.dnf}</span>
                        </button>
                    </div>

                    {/* Loaned Books */}
                    {bookCounts.loaned > 0 && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Loaned Books</div>
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
                                            ({bookCounts.overdue} overdue)
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
                        <button
                            className={`sidebar-item ${isActive('format', 'Physical') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'format', value: 'Physical' })}
                        >
                            <span className="sidebar-icon">📖</span>
                            <span className="sidebar-label">Physical</span>
                            <span className="sidebar-count">{bookCounts.physical}</span>
                        </button>
                        <button
                            className={`sidebar-item ${isActive('format', 'Ebook') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'format', value: 'Ebook' })}
                        >
                            <span className="sidebar-icon">💻</span>
                            <span className="sidebar-label">Ebook</span>
                            <span className="sidebar-count">{bookCounts.ebook}</span>
                        </button>
                        <button
                            className={`sidebar-item ${isActive('format', 'Audiobook') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'format', value: 'Audiobook' })}
                        >
                            <span className="sidebar-icon">🎧</span>
                            <span className="sidebar-label">Audiobook</span>
                            <span className="sidebar-count">{bookCounts.audiobook}</span>
                        </button>
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
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
                    {/* System Section */}
                    <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        <div className="sidebar-section-title">System</div>
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
                </div>
            </aside>
        </>
    );
};
