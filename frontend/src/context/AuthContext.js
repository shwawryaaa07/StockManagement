import React, { createContext, useContext, useEffect } from 'react';
import { verifyAuthToken } from '../services/api';
import useAuthStore from '../store/useAuthStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const auth = useAuthStore();

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            verifyAuthToken(token)
                .then(res => {
                    if (res.data && res.data.valid) {
                        const userData = {
                            username: res.data.username,
                            role: res.data.role,
                            tenantType: res.data.tenantType,
                            shopName: res.data.shopName
                        };
                        auth.login(token, userData);
                    } else {
                        auth.logout();
                    }
                })
                .catch(() => {
                    auth.logout();
                })
                .finally(() => {
                    auth.setLoading(false);
                });
        } else {
            auth.setLoading(false);
        }

        const handleLogoutEvent = () => {
            auth.logout();
        };
        window.addEventListener('auth-logout', handleLogoutEvent);
        return () => {
            window.removeEventListener('auth-logout', handleLogoutEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    return context || useAuthStore.getState();
}

export default AuthContext;
