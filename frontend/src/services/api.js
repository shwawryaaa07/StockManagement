import axios from 'axios';

// Cloud production backend with local fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.REACT_APP_API_BASE_URL || 
                     'https://stockmanagement07.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL
});

// Request Interceptor: Automatically inject Bearer JWT Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/staff') && !error.config.url.includes('/auth/visitor')) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.dispatchEvent(new Event('auth-logout'));
        }
    }
    return Promise.reject(error);
});

// Helper: Check if user is in Sandbox / Demo mode
const isSandboxMode = () => {
    const tenant = localStorage.getItem('tenantType') || sessionStorage.getItem('tenantType');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return tenant === 'DEMO' || role === 'VISITOR';
};

// Initial Mock Sandbox Data for Visitors (Portfolio Demo)
const INITIAL_DEMO_PRODUCTS = [
    { id: 101, name: 'Samsung Crystal 4K 55" Smart TV', category: 'Television', unitPrice: 46990, stockQuantity: 6, active: true },
    { id: 102, name: 'LG 260L Double Door Refrigerator', category: 'Refrigerator', unitPrice: 26500, stockQuantity: 4, active: true },
    { id: 103, name: 'Voltas 1.5 Ton 5-Star Split AC', category: 'Air Conditioner', unitPrice: 37490, stockQuantity: 5, active: true },
    { id: 104, name: 'Sony HT-S20R 5.1ch Soundbar', category: 'Audio System', unitPrice: 17990, stockQuantity: 8, active: true },
    { id: 105, name: 'Whirlpool 7.5kg Automatic Washing Machine', category: 'Washing Machine', unitPrice: 18750, stockQuantity: 3, active: true },
    { id: 106, name: 'Havells 1200mm Ceiling Fan (Gold)', category: 'Small Appliances', unitPrice: 2450, stockQuantity: 14, active: true }
];

const INITIAL_DEMO_INVOICES = [
    {
        id: 501,
        invoiceNumber: 'DEMO-1001',
        customerName: 'Anand Shirodkar',
        customerContact: '9822123456',
        deliveryAddress: 'Main Market, Valpoi, Goa',
        paymentMethod: 'UPI',
        subtotal: 46990,
        gstRate: 18,
        gstAmount: 8458.20,
        discountAmount: 1000,
        totalAmount: 54448.20,
        amountPaid: 54448.20,
        balanceDue: 0,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        items: [
            { product: { name: 'Samsung Crystal 4K 55" Smart TV' }, quantity: 1, unitPrice: 46990, serialNumber: 'SAM-55-TV-9921' }
        ]
    },
    {
        id: 502,
        invoiceNumber: 'DEMO-1002',
        customerName: 'Pooja Naik',
        customerContact: '9765432100',
        deliveryAddress: 'Near SBI Bank, Valpoi',
        paymentMethod: 'CASH',
        subtotal: 26500,
        gstRate: 18,
        gstAmount: 4770,
        discountAmount: 500,
        totalAmount: 30770,
        amountPaid: 20000,
        balanceDue: 10770,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        items: [
            { product: { name: 'LG 260L Double Door Refrigerator' }, quantity: 1, unitPrice: 26500, serialNumber: 'LG-REF-4412' }
        ]
    }
];

const getSandboxProducts = () => {
    const saved = localStorage.getItem('demo_sandbox_products');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem('demo_sandbox_products', JSON.stringify(INITIAL_DEMO_PRODUCTS));
    return INITIAL_DEMO_PRODUCTS;
};

const getSandboxInvoices = () => {
    const saved = localStorage.getItem('demo_sandbox_invoices');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem('demo_sandbox_invoices', JSON.stringify(INITIAL_DEMO_INVOICES));
    return INITIAL_DEMO_INVOICES;
};

// 3-Tier Authentication
export const loginAsOwner = (pinOrPassword) => {
    if (/^\d+$/.test(pinOrPassword.trim())) {
        return api.post('/auth/login', { pin: pinOrPassword.trim() });
    } else {
        return api.post('/auth/login', { username: 'admin', password: pinOrPassword });
    }
};

export const loginAsStaff = (username, pin) => api.post('/auth/staff', { username, pin });
export const loginAsVisitor = () => api.post('/auth/visitor');
export const verifyAuthToken = () => api.get('/auth/verify');

// Products (With isolated sandbox interceptor)
export const getProducts = () => {
    if (isSandboxMode()) {
        const prods = getSandboxProducts();
        return Promise.resolve({ data: prods });
    }
    return api.get('/products');
};

export const createProduct = (product) => {
    if (isSandboxMode()) {
        const prods = getSandboxProducts();
        const newProd = { ...product, id: Date.now(), active: true };
        const updated = [newProd, ...prods];
        localStorage.setItem('demo_sandbox_products', JSON.stringify(updated));
        return Promise.resolve({ data: newProd });
    }
    return api.post('/products', product);
};

export const updateProduct = (id, product) => {
    if (isSandboxMode()) {
        const prods = getSandboxProducts();
        const updated = prods.map(p => p.id === Number(id) ? { ...p, ...product } : p);
        localStorage.setItem('demo_sandbox_products', JSON.stringify(updated));
        return Promise.resolve({ data: product });
    }
    return api.put(`/products/${id}`, product);
};

export const deleteProduct = (id) => {
    if (isSandboxMode()) {
        const prods = getSandboxProducts();
        const updated = prods.filter(p => p.id !== Number(id));
        localStorage.setItem('demo_sandbox_products', JSON.stringify(updated));
        return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/products/${id}`);
};

// Invoices (With isolated sandbox interceptor)
export const getInvoices = () => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        return Promise.resolve({ data: invs });
    }
    return api.get('/invoices');
};

export const getInvoice = (id) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const found = invs.find(i => String(i.id) === String(id) || String(i.invoiceNumber) === String(id));
        return Promise.resolve({ data: found || invs[0] });
    }
    return api.get(`/invoices/${id}`);
};

export const createInvoice = (invoice) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const newInv = {
            ...invoice,
            id: Date.now(),
            invoiceNumber: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: new Date().toISOString()
        };
        const updated = [newInv, ...invs];
        localStorage.setItem('demo_sandbox_invoices', JSON.stringify(updated));
        return Promise.resolve({ data: newInv });
    }
    return api.post('/invoices', invoice);
};

export const updateInvoice = (id, invoice) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const updated = invs.map(i => i.id === Number(id) ? { ...i, ...invoice } : i);
        localStorage.setItem('demo_sandbox_invoices', JSON.stringify(updated));
        return Promise.resolve({ data: invoice });
    }
    return api.put(`/invoices/${id}`, invoice);
};

export const getDueInvoices = () => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const dues = invs.filter(i => Number(i.balanceDue || 0) > 0);
        return Promise.resolve({ data: dues });
    }
    return api.get('/invoices/due');
};

export const getPaidInvoices = () => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const paids = invs.filter(i => Number(i.balanceDue || 0) === 0);
        return Promise.resolve({ data: paids });
    }
    return api.get('/invoices/paid');
};

export const getDashboard = () => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const prods = getSandboxProducts();
        
        let totalSales = 0;
        let totalPaid = 0;
        let totalDue = 0;
        
        invs.forEach(i => {
            totalSales += Number(i.totalAmount || 0);
            totalPaid += Number(i.amountPaid || 0);
            totalDue += Number(i.balanceDue || 0);
        });

        let inventoryValue = 0;
        prods.forEach(p => {
            inventoryValue += (Number(p.unitPrice || 0) * Number(p.stockQuantity || 0));
        });

        return Promise.resolve({
            data: {
                totalSales,
                totalPaid,
                totalDue,
                totalInvoices: invs.length,
                totalProducts: prods.length,
                inventoryValue,
                recentInvoices: invs.slice(0, 5),
                lowStockProducts: prods.filter(p => p.stockQuantity <= 5)
            }
        });
    }
    return api.get('/invoices/dashboard');
};

export const searchInvoices = (customer) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const filtered = invs.filter(i => (i.customerName || '').toLowerCase().includes(customer.toLowerCase()));
        return Promise.resolve({ data: filtered });
    }
    return api.get(`/invoices/search?customer=${customer}`);
};

export const settleDueInvoice = (id, paymentData) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const updated = invs.map(i => {
            if (i.id === Number(id)) {
                const paidNow = Number(paymentData.amountPaid || 0);
                const newPaid = Number(i.amountPaid || 0) + paidNow;
                const newDue = Math.max(0, Number(i.totalAmount || 0) - newPaid);
                return { ...i, amountPaid: newPaid, balanceDue: newDue };
            }
            return i;
        });
        localStorage.setItem('demo_sandbox_invoices', JSON.stringify(updated));
        return Promise.resolve({ data: { success: true } });
    }
    return api.post(`/invoices/${id}/settle`, paymentData);
};

export const recordPayment = (id, paymentData) => settleDueInvoice(id, paymentData);

export const deleteInvoice = (id) => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const updated = invs.filter(i => i.id !== Number(id));
        localStorage.setItem('demo_sandbox_invoices', JSON.stringify(updated));
        return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/invoices/${id}`);
};

export default api;
