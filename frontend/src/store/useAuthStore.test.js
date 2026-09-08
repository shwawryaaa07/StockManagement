import { useAuthStore } from './useAuthStore';

describe('useAuthStore Zustand store', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        useAuthStore.getState().logout();
    });

    test('initializes with unauthenticated state when storage is empty', () => {
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.isOwner).toBe(false);
        expect(state.isVisitor).toBe(false);
    });

    test('login sets user state and role booleans for OWNER', () => {
        const userData = {
            username: 'admin',
            role: 'OWNER',
            shopName: 'MANISHA ELECTRONICS',
            tenantType: 'PROD'
        };

        useAuthStore.getState().login('test-jwt-token', userData, true);

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.isOwner).toBe(true);
        expect(state.isStaff).toBe(false);
        expect(state.isVisitor).toBe(false);
        expect(localStorage.getItem('authToken')).toBe('test-jwt-token');
    });

    test('login sets isVisitor flag for DEMO visitor account', () => {
        const demoUser = {
            username: 'visitor',
            role: 'VISITOR',
            shopName: 'Manisha Electronics (Demo)',
            tenantType: 'DEMO'
        };

        useAuthStore.getState().login('demo-token', demoUser, false);

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.isVisitor).toBe(true);
        expect(state.isOwner).toBe(false);
        expect(sessionStorage.getItem('authToken')).toBe('demo-token');
    });

    test('logout clears store state and storage items', () => {
        const userData = { username: 'staff1', role: 'STAFF' };
        useAuthStore.getState().login('staff-token', userData, true);

        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.isStaff).toBe(false);
        expect(localStorage.getItem('authToken')).toBeNull();
    });
});
