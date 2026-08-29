import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            verifyAuthToken()
                .then(res => {
                    if (res.data && res.data.valid) {
                        setIsAuthenticated(true);
                        setUser({ username: res.data.username, shopName: res.data.shopName });
                    } else {
                        logout();
                    }
                })
                .catch(() => {
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }

        const handleLogoutEvent = () => {
            setIsAuthenticated(false);
            setUser(null);
        };
        window.addEventListener('auth-logout', handleLogoutEvent);
        return () => {
            window.removeEventListener('auth-logout', handleLogoutEvent);
        };
    }, []);

    const login = (token, userData, rememberMe = true) => {
        if (rememberMe) {
            localStorage.setItem('authToken', token);
            sessionStorage.removeItem('authToken');
        } else {
            sessionStorage.setItem('authToken', token);
            localStorage.removeItem('authToken');
        }
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
