import React from 'react';
import { type Shelf } from '../../types/shelf';

export interface SidebarFilter {
    type: 'all' | 'status' | 'format' | 'shelf' | 'series' | 'loaned';
    value?: string;
    shelfId?: number;
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
    isVisible = true
}) => {
    const isActive = (type: string, value?: string) => {
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

            {/* Show Sidebar Button - Visible when sidebar is hidden */}
            {!isVisible && onToggleSidebar && (
                <button
                    className="secondary-btn small"
                    onClick={onToggleSidebar}
                    title="Show Sidebar"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '20px',
                        zIndex: 100,
                        padding: '8px 12px'
                    }}
                >
                    ▶ Filters
                </button>
            )}

            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`} style={{ display: isVisible ? 'block' : 'none' }}>
                {/* Sidebar Header with Hide Button */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Filters</h3>
                    {onToggleSidebar && (
                        <button
                            className="secondary-btn small"
                            onClick={onToggleSidebar}
                            title="Hide Sidebar"
                            style={{ padding: '4px 8px' }}
                        >
                            ◀
                        </button>
                    )}
                </div>

                <div className="sidebar-content">
                    {/* All Books */}
                    <div className="sidebar-section">
                        <button
                            className={`sidebar-item ${isActive('all') ? 'active' : ''}`}
                            onClick={() => handleFilterClick({ type: 'all' })}
                        >
                            <span className="sidebar-icon">📚</span>
                            <span className="sidebar-label">All Books</span>
                            <span className="sidebar-count">{bookCounts.total}</span>
                        </button>
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
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                                title="Manage Shelves"
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
                            <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                No shelves created
                            </div>
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
            </aside>
        </>
    );
};
