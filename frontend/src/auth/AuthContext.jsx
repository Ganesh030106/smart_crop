/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── API base URL ────────────────────────────────────────────────────────────
// In dev: empty string (Vite proxy handles /api → localhost:5000)
// In standalone prod frontend: set VITE_API_URL=https://your-backend.onrender.com
const API = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        if (token) {
            fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then((data) => {
                    if (data.user) { setUser(data.user); }
                    else { localStorage.removeItem('auth_token'); setToken(null); }
                })
                .catch(() => { localStorage.removeItem('auth_token'); setToken(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (email, password) => {
        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            localStorage.setItem('auth_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            throw new Error(err.message || 'Invalid email or password');
        }
    }, []);

    const register = useCallback(async (name, email, password, region) => {
        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, region }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            localStorage.setItem('auth_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            throw new Error(err.message || 'Registration failed');
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    }, []);

    const authFetch = useCallback((url, options = {}) => {
        const headers = {
            Authorization: `Bearer ${token || ''}`,
            ...(options.headers || {}),
        };
        // Only set Content-Type for non-FormData bodies (let browser set multipart boundary)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }
        return fetch(url, { ...options, headers });
    }, [token]);

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            login, register, logout, authFetch,
            isAdmin: user?.role === 'admin',
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
