import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
    theme: 'light' | 'dark';
    accentColor: string;
    setTheme: (theme: 'light' | 'dark') => void;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
    const [accentColor, setAccentColorState] = useState<string>('theme-purple');

    useEffect(() => {
        const storedTheme = localStorage.getItem('bookboss_theme') as 'light' | 'dark';
        const storedAccent = localStorage.getItem('bookboss_accent');

        if (storedTheme) setThemeState(storedTheme);
        if (storedAccent) setAccentColorState(storedAccent);
    }, []);

    useEffect(() => {
        // Apply theme class
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    useEffect(() => {
        // Apply accent color class
        document.body.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-pink');
        if (accentColor && accentColor !== 'default') {
            document.body.classList.add(accentColor);
        }
    }, [accentColor]);

    const setTheme = (newTheme: 'light' | 'dark') => {
        setThemeState(newTheme);
        localStorage.setItem('bookboss_theme', newTheme);
    };

    const setAccentColor = (newColor: string) => {
        setAccentColorState(newColor);
        localStorage.setItem('bookboss_accent', newColor);
    };

    return (
        <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
