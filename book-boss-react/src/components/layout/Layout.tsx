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
                    <div className="nav-item active">
                        <span>Library</span>
                    </div>
                </div>
            </div>
            <div className="content-area">
                <div className="top-bar">
                    <h1>BookBoss React</h1>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                        Toggle Theme
                    </button>
                </div>
                <div style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};
