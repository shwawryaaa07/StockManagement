import { create } from 'zustand';

const getInitialAuth = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'VISITOR';
    const username = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'User';
    const shopName = localStorage.getItem('shopName') || sessionStorage.getItem('shopName') || 'MANISHA ELECTRONICS';
    const tenantType = localStorage.getItem('tenantType') || sessionStorage.getItem('tenantType') || 'PROD';

    return {
        isAuthenticated: Boolean(token),
        user: token ? { role, username, shopName, tenantType } : null,
        loading: Boolean(token) // will be resolved on verify
    };
};

export const useAuthStore = create((set, get) => {
    const initial = getInitialAuth();

    return {
        isAuthenticated: initial.isAuthenticated,
        user: initial.user,
        loading: initial.loading,

        isOwner: initial.user?.role === 'OWNER' || initial.user?.role === 'ADMIN',
        isStaff: initial.user?.role === 'STAFF',
        isVisitor: initial.user?.role === 'VISITOR' || initial.user?.tenantType === 'DEMO',

        setLoading: (loading) => set({ loading }),

        login: (token, userData, rememberMe = true) => {
            const authKeys = ['authToken', 'userRole', 'userName', 'shopName', 'tenantType'];
            authKeys.forEach((k) => {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            });

            const targetStorage = rememberMe ? localStorage : sessionStorage;
            targetStorage.setItem('authToken', token);
            targetStorage.setItem('userRole', userData.role || 'OWNER');
            targetStorage.setItem('userName', userData.username || 'User');
            targetStorage.setItem('shopName', userData.shopName || 'MANISHA ELECTRONICS');
            targetStorage.setItem('tenantType', userData.tenantType || 'PROD');

            const isOwner = userData.role === 'OWNER' || userData.role === 'ADMIN';
            const isStaff = userData.role === 'STAFF';
            const isVisitor = userData.role === 'VISITOR' || userData.tenantType === 'DEMO';

            set({
                isAuthenticated: true,
                user: userData,
                loading: false,
                isOwner,
                isStaff,
                isVisitor
            });
        },

        logout: () => {
            const authKeys = ['authToken', 'userRole', 'userName', 'shopName', 'tenantType'];
            authKeys.forEach((k) => {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            });

            set({
                isAuthenticated: false,
                user: null,
                loading: false,
                isOwner: false,
                isStaff: false,
                isVisitor: false
            });
        }
    };
});

export default useAuthStore;
