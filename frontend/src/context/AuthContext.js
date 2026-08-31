import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
    });
    const [user, setUser] = useState(() => {
        const cachedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'VISITOR';
        const cachedUsername = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'User';
        const cachedShop = localStorage.getItem('shopName') || sessionStorage.getItem('shopName') || 'MANISHA ELECTRONICS';
        const cachedTenant = localStorage.getItem('tenantType') || sessionStorage.getItem('tenantType') || 'PROD';
        return { role: cachedRole, username: cachedUsername, shopName: cachedShop, tenantType: cachedTenant };
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            verifyAuthToken()
                .then(res => {
                    if (res.data && res.data.valid) {
                        setIsAuthenticated(true);
                        const userData = {
                            username: res.data.username,
                            role: res.data.role,
                            tenantType: res.data.tenantType,
                            shopName: res.data.shopName
                        };
                        setUser(userData);
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
            localStorage.setItem('userRole', userData.role || 'OWNER');
            localStorage.setItem('userName', userData.username || 'User');
            localStorage.setItem('shopName', userData.shopName || 'MANISHA ELECTRONICS');
            localStorage.setItem('tenantType', userData.tenantType || 'PROD');
            sessionStorage.clear();
        } else {
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('userRole', userData.role || 'OWNER');
            sessionStorage.setItem('userName', userData.username || 'User');
            sessionStorage.setItem('shopName', userData.shopName || 'MANISHA ELECTRONICS');
            sessionStorage.setItem('tenantType', userData.tenantType || 'PROD');
            localStorage.clear();
        }
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
    };

    const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';
    const isStaff = user?.role === 'STAFF';
    const isVisitor = user?.role === 'VISITOR' || user?.tenantType === 'DEMO';

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isOwner, isStaff, isVisitor, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
