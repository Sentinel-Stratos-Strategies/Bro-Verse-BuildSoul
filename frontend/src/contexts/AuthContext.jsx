import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, getAuthTokens, setAuthTokens, clearAuthTokens } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('broverse_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                // corrupted, ignore
            }
        }
        setLoading(false);
    }, []);

    // Listen for auth expiry events
    useEffect(() => {
        const handler = () => {
            setUser(null);
        };
        window.addEventListener('broverse:auth:expired', handler);
        return () => window.removeEventListener('broverse:auth:expired', handler);
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password },
            auth: false
        });

        setAuthTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        });

        const userData = { id: data.user.id, email: data.user.email, displayName: data.user.displayName };
        localStorage.setItem('broverse_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (email, password, displayName, tagline) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: { email, password, displayName, tagline },
            auth: false
        });

        setAuthTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        });

        const userData = { id: data.user.id, email: data.user.email, displayName: data.user.displayName };
        localStorage.setItem('broverse_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } catch {
            // ignore logout API errors
        }
        clearAuthTokens();
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
