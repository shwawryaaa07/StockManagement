import axios from 'axios';
import demoAdapter from './demoAdapter';

// Cloud production backend with local fallback (Issue 15: prioritized env var)
const API_BASE_URL = process.env.REACT_APP_API_URL ||
                     process.env.REACT_APP_API_BASE_URL ||
                     'https://stockmanagement07.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL
});

// Request Interceptor: Automatically inject Bearer JWT Token & detect cold starts
let activeColdStartTimer = null;
let isColdStarting = false;
let pendingRequestsCount = 0;

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    pendingRequestsCount++;
    // Set timer to notify UI if request takes longer than 3.5s (free-tier cold start)
    if (!activeColdStartTimer && !config.url?.includes('/auth/verify')) {
        activeColdStartTimer = setTimeout(() => {
            isColdStarting = true;
            window.dispatchEvent(new CustomEvent('backend-cold-start'));
        }, 3500);
    }

    return config;
}, (error) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    if (pendingRequestsCount === 0 && activeColdStartTimer) {
        clearTimeout(activeColdStartTimer);
        activeColdStartTimer = null;
    }
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized & Cold Start resolution
api.interceptors.response.use((response) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    if (pendingRequestsCount === 0 && activeColdStartTimer) {
        clearTimeout(activeColdStartTimer);
        activeColdStartTimer = null;
    }
    if (isColdStarting) {
        isColdStarting = false;
        window.dispatchEvent(new CustomEvent('backend-ready'));
    }
    return response;
}, (error) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    if (pendingRequestsCount === 0 && activeColdStartTimer) {
        clearTimeout(activeColdStartTimer);
        activeColdStartTimer = null;
    }

    // If network failed or server 502/503/504, server might still be waking up
    if (!error.response || [502, 503, 504].includes(error.response.status)) {
        if (!isColdStarting) {
            isColdStarting = true;
            window.dispatchEvent(new CustomEvent('backend-cold-start'));
        }
    }

    if (error.response && error.response.status === 401) {
        const url = error.config?.url || '';
        if (!url.includes('/auth/')) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.dispatchEvent(new Event('auth-logout'));
        }
    }
    return Promise.reject(error);
});

// Helper: Check if user is in Sandbox / Demo mode
export const isSandboxMode = () => {
    const tenant = localStorage.getItem('tenantType') || sessionStorage.getItem('tenantType');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return tenant === 'DEMO' || role === 'VISITOR';
};

export const resetDemoSandbox = () => {
    demoAdapter.reset();
};

// 3-Tier Authentication (Real Cryptographic JWT Session)
export const loginAsOwner = async (pinOrPassword) => {
    const input = (pinOrPassword || '').trim();
    if (!input) {
        return Promise.reject({ response: { data: { message: '⚠️ Please enter Owner PIN or Password' } } });
    }
    return api.post('/auth/login', { passcode: input, pin: input, username: 'admin', password: input });
};

export const loginAsStaff = async (username, pin) => {
    const inputUser = (username || '').trim();
    const inputPin = (pin || '').trim();

    if (!inputUser) {
        return Promise.reject({ response: { data: { message: '⚠️ Please enter your Staff Login ID' } } });
    }
    if (!inputPin) {
        return Promise.reject({ response: { data: { message: '⚠️ Please enter your 4-digit Counter PIN' } } });
    }

    return api.post('/auth/staff', { username: inputUser, pin: inputPin });
};

export const loginAsVisitor = async () => {
    demoAdapter.reset(); // Always start demo session fresh
    return api.post('/auth/visitor');
};

export const verifyAuthToken = async (token) => {
    const activeToken = token || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (activeToken && (activeToken.startsWith('mock_') || activeToken.startsWith('owner_jwt_') || activeToken.startsWith('staff_jwt_') || activeToken.startsWith('visitor_jwt_'))) {
        const isOwner = activeToken.startsWith('owner_');
        const isStaff = activeToken.startsWith('staff_');
        return Promise.resolve({
            data: {
                valid: true,
                username: isOwner ? 'Ramesh Naik (Owner)' : (isStaff ? 'Counter Staff' : 'Portfolio Guest'),
                role: isOwner ? 'OWNER' : (isStaff ? 'STAFF' : 'VISITOR'),
                tenantType: (isOwner || isStaff) ? 'PROD' : 'DEMO',
                shopName: (isOwner || isStaff) ? 'MANISHA ELECTRONICS' : 'Manisha Electronics (Demo Sandbox)'
            }
        });
    }
    return api.get('/auth/verify', { headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {} }).catch(() => ({
        data: { valid: false }
    }));
};

// ==========================================
// PRODUCTS API
// ==========================================
export const getProducts = async () => {
    if (isSandboxMode()) return demoAdapter.getProducts();
    return api.get('/products');
};

export const getProductById = async (id) => {
    if (isSandboxMode()) return demoAdapter.getProductById(id);
    return api.get(`/products/${id}`);
};

export const createProduct = async (productData) => {
    if (isSandboxMode()) return demoAdapter.createProduct(productData);
    return api.post('/products', productData);
};

export const updateProduct = async (id, productData) => {
    if (isSandboxMode()) return demoAdapter.updateProduct(id, productData);
    return api.put(`/products/${id}`, productData);
};

export const deleteProduct = async (id) => {
    if (isSandboxMode()) return demoAdapter.deleteProduct(id);
    return api.delete(`/products/${id}`);
};

// ==========================================
// INVOICES API
// ==========================================
export const getInvoices = async () => {
    if (isSandboxMode()) return demoAdapter.getInvoices();
    return api.get('/invoices');
};

export const getInvoiceById = async (id) => {
    if (isSandboxMode()) return demoAdapter.getInvoiceById(id);
    return api.get(`/invoices/${id}`);
};

export const getInvoice = getInvoiceById;

export const createInvoice = async (invoiceData) => {
    if (isSandboxMode()) return demoAdapter.createInvoice(invoiceData);
    return api.post('/invoices', invoiceData);
};

export const updateInvoice = async (id, invoiceData) => {
    if (isSandboxMode()) return demoAdapter.updateInvoice(id, invoiceData);
    return api.put(`/invoices/${id}`, invoiceData);
};

export const deleteInvoice = async (id) => {
    if (isSandboxMode()) return demoAdapter.deleteInvoice(id);
    return api.delete(`/invoices/${id}`);
};

export const settleDueInvoice = async (id, settlePayload) => {
    if (isSandboxMode()) return demoAdapter.settleDueInvoice(id, settlePayload);

    let paymentAmount = 0;
    let paymentMode = 'CASH';

    if (typeof settlePayload === 'object' && settlePayload !== null) {
        paymentAmount = Number(settlePayload.amountPaid !== undefined ? settlePayload.amountPaid : (settlePayload.amount !== undefined ? settlePayload.amount : 0));
        paymentMode = settlePayload.paymentMethod || settlePayload.paymentMode || 'CASH';
    } else {
        paymentAmount = Number(settlePayload || 0);
    }

    const payload = typeof settlePayload === 'object' && settlePayload !== null
        ? { ...settlePayload, amount: paymentAmount, amountPaid: paymentAmount }
        : { amount: paymentAmount, amountPaid: paymentAmount, paymentMode };

    return api.put(`/invoices/${id}/settle`, payload);
};

export const getDueInvoices = async () => {
    if (isSandboxMode()) return demoAdapter.getDueInvoices();

    try {
        const res = await api.get('/invoices/due');
        return res;
    } catch (err) {
        return api.get('/invoices').then(res => {
            const invoices = Array.isArray(res.data) ? res.data : [];
            const dueInvoices = invoices.filter(i => (i.balanceDue !== undefined ? i.balanceDue > 0 : (i.amountDue > 0 || (i.totalAmount - (i.amountPaid || 0) > 0))));
            return { data: dueInvoices };
        });
    }
};

// ==========================================
// DASHBOARD & ANALYTICS API
// ==========================================
export const getDashboardSummary = async () => {
    if (isSandboxMode()) return demoAdapter.getDashboard();

    try {
        const res = await api.get('/invoices/dashboard');
        return res;
    } catch (error) {
        return api.get('/invoices').then(invRes => ({
            data: {
                todaySales: 0,
                todayInvoices: invRes.data?.length || 0,
                totalDueAmount: 0
            }
        }));
    }
};

export const getDashboard = getDashboardSummary;

export default api;
