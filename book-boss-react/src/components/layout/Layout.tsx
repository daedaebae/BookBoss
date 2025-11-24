import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsModal } from '../settings/SettingsModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="app-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>BookBoss</h2>
                    {user && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            {user.username}
                        </p>
                    )}
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
                        <h3>System</h3>
                        <div className="nav-item" onClick={() => setIsSettingsOpen(true)}>
                            <span className="icon">⚙️</span>
                            <span>Settings</span>
                        </div>
                        <div className="nav-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            <span className="icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                            <span>Toggle Theme</span>
                        </div>
                        <div className="nav-item" onClick={logout}>
                            <span className="icon">🚪</span>
                            <span>Logout</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-area">
                {children}
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};
