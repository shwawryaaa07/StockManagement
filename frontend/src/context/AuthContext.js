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

    const clearAuthOnly = () => {
        const authKeys = ['authToken', 'userRole', 'userName', 'shopName', 'tenantType'];
        authKeys.forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = (token, userData, rememberMe = true) => {
        clearAuthOnly();
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        
        targetStorage.setItem('authToken', token);
        targetStorage.setItem('userRole', userData.role || 'OWNER');
        targetStorage.setItem('userName', userData.username || 'User');
        targetStorage.setItem('shopName', userData.shopName || 'MANISHA ELECTRONICS');
        targetStorage.setItem('tenantType', userData.tenantType || 'PROD');

        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = () => {
        clearAuthOnly();
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

export default AuthContext;
