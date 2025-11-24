import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="app-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>BookBoss</h2>
                </div>
                <div className="sidebar-nav">
                    <div className="nav-section">
                        <h3>Library</h3>
                        <div className="nav-item active">
                            <span className="icon">📚</span>
                            <span>All Books</span>
                        </div>
                    </div>
                    <div className="nav-section">
                        <h3>Settings</h3>
                        <div className="nav-item">
                            <span className="icon">⚙️</span>
                            <span>Preferences</span>
                        </div>
                        <div className="nav-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            <span className="icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                            <span>Toggle Theme</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-area">
                {children}
            </div>
        </div>
    );
};
