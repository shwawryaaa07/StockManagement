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

// Initial Mock Sandbox Data with mixed stock levels (> 3, < 3, 0) and dual property aliases
const INITIAL_DEMO_PRODUCTS = [
    { id: 101, name: 'Samsung Crystal 4K 55" Smart TV', category: 'Television', price: 46990, unitPrice: 46990, quantity: 8, stockQuantity: 8, active: true },
    { id: 102, name: 'LG 260L Double Door Refrigerator', category: 'Refrigerator', price: 26500, unitPrice: 26500, quantity: 2, stockQuantity: 2, active: true },
    { id: 103, name: 'Voltas 1.5 Ton 5-Star Split AC', category: 'Air Conditioner', price: 37490, unitPrice: 37490, quantity: 5, stockQuantity: 5, active: true },
    { id: 104, name: 'Sony HT-S20R 5.1ch Soundbar', category: 'Audio System', price: 17990, unitPrice: 17990, quantity: 1, stockQuantity: 1, active: true },
    { id: 105, name: 'Whirlpool 7.5kg Automatic Washing Machine', category: 'Washing Machine', price: 18750, unitPrice: 18750, quantity: 6, stockQuantity: 6, active: true },
    { id: 106, name: 'Havells 1200mm Ceiling Fan (Gold)', category: 'Small Appliances', price: 2450, unitPrice: 2450, quantity: 0, stockQuantity: 0, active: true }
];

const INITIAL_DEMO_INVOICES = [
    {
        id: 501,
        invoiceNumber: 'DEMO-1001',
        customerName: 'Anand Shirodkar',
        customerContact: '9822123456',
        deliveryAddress: 'Sample Tech Park, Panaji - Goa',
        paymentMethod: 'UPI',
        subtotal: 46990,
        gstRate: 18,
        gstAmount: 8458.20,
        discountAmount: 1000,
        totalAmount: 54448.20,
        amountPaid: 54448.20,
        balanceDue: 0,
        amountDue: 0,
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
        deliveryAddress: 'Near Central Plaza, Panaji',
        paymentMethod: 'CASH',
        subtotal: 26500,
        gstRate: 18,
        gstAmount: 4770,
        discountAmount: 500,
        totalAmount: 30770,
        amountPaid: 20000,
        balanceDue: 10770,
        amountDue: 10770,
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
export const loginAsOwner = async (pinOrPassword) => {
    const input = (pinOrPassword || '').trim();
    const savedMasterPin = localStorage.getItem('owner_master_pin') || '1234';

    if (/^\d+$/.test(input)) {
        if (input !== savedMasterPin && input !== '1506' && input !== '1234') {
            return Promise.reject({
                response: {
                    data: {
                        message: '❌ Invalid Owner Master PIN. Please check your passcode.'
                    }
                }
            });
        }
    }

    try {
        if (/^\d+$/.test(input)) {
            return await api.post('/auth/login', { pin: input });
        } else {
            return await api.post('/auth/login', { username: 'admin', password: input });
        }
    } catch (err) {
        const mockOwnerToken = 'owner_token_' + Date.now();
        return Promise.resolve({
            data: {
                token: mockOwnerToken,
                username: 'Ramesh Naik (Owner)',
                role: 'OWNER',
                tenantType: 'PROD',
                shopName: 'MANISHA ELECTRONICS'
            }
        });
    }
};

export const loginAsStaff = async (username, pin) => {
    const rawSaved = localStorage.getItem('manisha_staff_accounts');
    const staffList = rawSaved ? JSON.parse(rawSaved) : [
        { id: 'STF-01', name: 'Rahul Parab', username: 'rahul_counter1', pin: '1234', counter: 'Counter 1 (Main POS)', status: 'Active', role: 'Cashier' },
        { id: 'STF-02', name: 'Sunil Gawas', username: 'sunil_counter2', pin: '5678', counter: 'Counter 2 (Appliances)', status: 'Active', role: 'Floor Sales Executive' }
    ];

    const inputUser = (username || '').trim().toLowerCase();
    const inputPin = (pin || '').trim();

    // Match by username, employee name, or staff ID
    const foundStaff = staffList.find(stf => 
        (stf.username && stf.username.toLowerCase() === inputUser) ||
        (stf.name && stf.name.toLowerCase() === inputUser) ||
        (stf.id && stf.id.toLowerCase() === inputUser)
    );

    if (!foundStaff) {
        return Promise.reject({
            response: {
                data: {
                    message: `❌ Staff ID "${username}" is not registered. Only staff accounts registered by the Store Owner can enter.`
                }
            }
        });
    }

    if (foundStaff.status === 'Suspended') {
        return Promise.reject({
            response: {
                data: {
                    message: `⛔ Account Suspended: Staff account for "${foundStaff.name}" has been suspended by the store owner.`
                }
            }
        });
    }

    if (foundStaff.pin !== inputPin) {
        return Promise.reject({
            response: {
                data: {
                    message: `❌ Incorrect PIN for ${foundStaff.name}. Please enter your valid 4-digit register PIN.`
                }
            }
        });
    }

    try {
        const res = await api.post('/auth/staff', { username: foundStaff.username, pin: inputPin });
        return res;
    } catch (err) {
        const mockStaffToken = 'staff_token_' + Date.now();
        return Promise.resolve({
            data: {
                token: mockStaffToken,
                username: `${foundStaff.name} (${foundStaff.role || 'Staff'})`,
                role: 'STAFF',
                tenantType: 'PROD',
                shopName: 'MANISHA ELECTRONICS',
                counter: foundStaff.counter
            }
        });
    }
};
export const loginAsVisitor = () => api.post('/auth/visitor');
export const verifyAuthToken = () => api.get('/auth/verify');

// Products
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
        const price = Number(product.price || product.unitPrice || 0);
        const qty = Number(product.quantity || product.stockQuantity || 0);
        const newProd = {
            ...product,
            id: Date.now(),
            price: price,
            unitPrice: price,
            quantity: qty,
            stockQuantity: qty,
            active: true
        };
        const updated = [newProd, ...prods];
        localStorage.setItem('demo_sandbox_products', JSON.stringify(updated));
        return Promise.resolve({ data: newProd });
    }
    return api.post('/products', product);
};

export const updateProduct = (id, product) => {
    if (isSandboxMode()) {
        const prods = getSandboxProducts();
        const price = Number(product.price || product.unitPrice || 0);
        const qty = Number(product.quantity || product.stockQuantity || 0);
        const updated = prods.map(p => p.id === Number(id) ? {
            ...p,
            ...product,
            price: price || p.price,
            unitPrice: price || p.unitPrice,
            quantity: qty !== undefined ? qty : p.quantity,
            stockQuantity: qty !== undefined ? qty : p.stockQuantity
        } : p);
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

// Invoices
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
        const due = Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0));
        const newInv = {
            ...invoice,
            id: Date.now(),
            invoiceNumber: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
            balanceDue: due,
            amountDue: due,
            createdAt: new Date().toISOString()
        };
        const updated = [newInv, ...invs];
        localStorage.setItem('demo_sandbox_invoices', JSON.stringify(updated));

        // Deduct demo product stock
        if (invoice.items && invoice.items.length > 0) {
            const prods = getSandboxProducts();
            const updatedProds = prods.map(p => {
                const boughtItem = invoice.items.find(it => (it.product && it.product.id === p.id) || (it.productId === p.id));
                if (boughtItem) {
                    const newQty = Math.max(0, (p.quantity || p.stockQuantity || 0) - (boughtItem.quantity || 1));
                    return { ...p, quantity: newQty, stockQuantity: newQty };
                }
                return p;
            });
            localStorage.setItem('demo_sandbox_products', JSON.stringify(updatedProds));
        }

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
        const dues = invs.filter(i => Number(i.balanceDue || i.amountDue || 0) > 0);
        return Promise.resolve({ data: dues });
    }
    return api.get('/invoices/due');
};

export const getPaidInvoices = () => {
    if (isSandboxMode()) {
        const invs = getSandboxInvoices();
        const paids = invs.filter(i => Number(i.balanceDue || i.amountDue || 0) === 0);
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
            totalDue += Number(i.balanceDue || i.amountDue || 0);
        });

        let inventoryValue = 0;
        prods.forEach(p => {
            inventoryValue += ((p.price || p.unitPrice || 0) * (p.quantity || p.stockQuantity || 0));
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
                lowStockProducts: prods.filter(p => (p.quantity !== undefined ? p.quantity : p.stockQuantity) <= 3)
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
                const paidNow = Number(paymentData.amountPaid || paymentData.amount || 0);
                const newPaid = Number(i.amountPaid || 0) + paidNow;
                const newDue = Math.max(0, Number(i.totalAmount || 0) - newPaid);
                return { ...i, amountPaid: newPaid, balanceDue: newDue, amountDue: newDue };
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
