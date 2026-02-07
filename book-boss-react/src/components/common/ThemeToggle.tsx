import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <button
            className="secondary-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: '42px',
                height: '42px'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
};
