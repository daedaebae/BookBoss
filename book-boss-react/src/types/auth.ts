export interface User {
    id: number;
    username: string;
    is_admin: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextType extends AuthState {
    login: (token: string, user: User) => void;
    logout: () => void;
}
