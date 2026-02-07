import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import { settingsService } from '../services/settingsService';

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

        // Fetch global settings to ensure we have the latest server-side config
        const fetchGlobalSettings = async () => {
            try {
                // We need a token to fetch settings, check if we're theoretically logged in
                // (AuthContext handles actual auth state, but here we just need to know if we *can* fetch)
                if (localStorage.getItem('bookboss_token')) {
                    const settings = await settingsService.getSettings();
                    if (settings.accent_color) {
                        // Only update if different from local to avoid unnecessary re-renders/flickers
                        // or always update to enforce server source of truth? 
                        // Let's enforce server source of truth for accent color.
                        setAccentColorState(settings.accent_color);
                        localStorage.setItem('bookboss_accent', settings.accent_color);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch global theme settings:', error);
                // Fallback to local storage (already set above)
            }
        };

        fetchGlobalSettings();
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
        document.body.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-pink', 'theme-midnight', 'theme-forest', 'theme-sunset', 'theme-ocean');
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
