import React from 'react';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
    title?: string;
    onMobileSidebarToggle: () => void;
    onDesktopSidebarToggle: () => void;
    isSidebarVisible: boolean;
    children?: React.ReactNode;
    searchBar?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    onMobileSidebarToggle,
    onDesktopSidebarToggle,
    isSidebarVisible,
    children,
    searchBar
}) => {
    return (
        <div className="top-bar" style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                {/* Mobile Hamburger Menu */}
                <button
                    className="icon-btn mobile-only"
                    onClick={onMobileSidebarToggle}
                    style={{
                        fontSize: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '8px',
                    }}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                {/* Desktop Sidebar Toggle */}
                {!isSidebarVisible && (
                    <button
                        className="secondary-btn small desktop-only"
                        onClick={onDesktopSidebarToggle}
                        title="Show Menu"
                        style={{
                            padding: '8px 12px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        ▶ Menu
                    </button>
                )}

                {title && (
                    <h2 style={{ margin: 0, background: 'linear-gradient(to right, var(--title-gradient-start), var(--title-gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {title}
                    </h2>
                )}

                {searchBar && (
                    <div className="search-container" style={{ flex: 1 }}>
                        {searchBar}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {children}
                <ThemeToggle />
            </div>
        </div>
    );
};
