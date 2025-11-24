import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, type AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('bookboss_user');
            const storedToken = localStorage.getItem('bookboss_token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } else if (storedToken && !storedUser) {
                // Clear orphaned token
                localStorage.removeItem('bookboss_token');
            }
        } catch (error) {
            console.error('Error loading auth data from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem('bookboss_user');
            localStorage.removeItem('bookboss_token');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('bookboss_token', newToken);
        localStorage.setItem('bookboss_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('bookboss_token');
        localStorage.removeItem('bookboss_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user && !!token,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
