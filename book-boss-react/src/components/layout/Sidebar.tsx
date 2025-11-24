import React from 'react';

export interface SidebarFilter {
    type: 'all' | 'status' | 'format' | 'shelf';
    value?: string;
}

interface SidebarProps {
    activeFilter: SidebarFilter;
    onFilterChange: (filter: SidebarFilter) => void;
    shelves: string[];
    bookCounts: {
        total: number;
        notStarted: number;
        inProgress: number;
        completed: number;
        dnf: number;
        physical: number;
        ebook: number;
        audiobook: number;
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

            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`} style={{ display: isVisible ? 'block' : 'none' }}>
                {/* Sidebar Header with Show/Hide Button */}
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
                            title={isVisible ? "Hide Sidebar" : "Show Sidebar"}
                            style={{ padding: '4px 8px' }}
                        >
                            {isVisible ? '◀' : '▶'}
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
                    {shelves.length > 0 && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Shelves</div>
                            {shelves.map(shelf => (
                                <button
                                    key={shelf}
                                    className={`sidebar-item ${isActive('shelf', shelf) ? 'active' : ''}`}
                                    onClick={() => handleFilterClick({ type: 'shelf', value: shelf })}
                                >
                                    <span className="sidebar-icon">📚</span>
                                    <span className="sidebar-label">{shelf}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
