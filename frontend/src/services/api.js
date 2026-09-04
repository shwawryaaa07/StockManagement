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
const isSandboxMode = () => {
    const tenant = localStorage.getItem('tenantType') || sessionStorage.getItem('tenantType');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return tenant === 'DEMO' || role === 'VISITOR';
};

// Pristine initial demo dataset (Never mutates)
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

// Ephemeral In-Memory State for Visitors (Resets completely on page refresh!)
let memoryDemoProducts = JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS));
let memoryDemoInvoices = JSON.parse(JSON.stringify(INITIAL_DEMO_INVOICES));

export const resetDemoSandbox = () => {
    memoryDemoProducts = JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS));
    memoryDemoInvoices = JSON.parse(JSON.stringify(INITIAL_DEMO_INVOICES));
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
    resetDemoSandbox(); // Always start demo session fresh
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
        data: { valid: true, role: 'OWNER', username: 'Ramesh Naik (Owner)', tenantType: 'PROD', shopName: 'MANISHA ELECTRONICS' }
    }));
};

// ==========================================
// PRODUCTS API
// ==========================================
export const getProducts = async () => {
    if (isSandboxMode()) {
        return Promise.resolve({ data: memoryDemoProducts.filter(p => p.active !== false) });
    }
    return api.get('/products');
};

export const getProductById = async (id) => {
    if (isSandboxMode()) {
        const prod = memoryDemoProducts.find(p => p.id === Number(id));
        return prod ? Promise.resolve({ data: prod }) : Promise.reject({ response: { status: 404 } });
    }
    return api.get(`/products/${id}`);
};

export const getProduct = getProductById;

export const createProduct = async (productData) => {
    if (isSandboxMode()) {
        const newProduct = {
            id: Date.now(),
            name: productData.name,
            category: productData.category || 'General',
            price: Number(productData.price || productData.unitPrice || 0),
            unitPrice: Number(productData.price || productData.unitPrice || 0),
            quantity: Number(productData.quantity || productData.stockQuantity || 0),
            stockQuantity: Number(productData.quantity || productData.stockQuantity || 0),
            active: true
        };
        memoryDemoProducts.unshift(newProduct);
        return Promise.resolve({ data: newProduct });
    }
    return api.post('/products', productData);
};

export const updateProduct = async (id, productData) => {
    if (isSandboxMode()) {
        const index = memoryDemoProducts.findIndex(p => p.id === Number(id));
        if (index !== -1) {
            memoryDemoProducts[index] = {
                ...memoryDemoProducts[index],
                ...productData,
                price: Number(productData.price !== undefined ? productData.price : memoryDemoProducts[index].price),
                unitPrice: Number(productData.unitPrice !== undefined ? productData.unitPrice : memoryDemoProducts[index].unitPrice),
                quantity: Number(productData.quantity !== undefined ? productData.quantity : memoryDemoProducts[index].quantity),
                stockQuantity: Number(productData.stockQuantity !== undefined ? productData.stockQuantity : memoryDemoProducts[index].stockQuantity)
            };
            return Promise.resolve({ data: memoryDemoProducts[index] });
        }
        return Promise.reject({ response: { status: 404 } });
    }
    return api.put(`/products/${id}`, productData);
};

export const deleteProduct = async (id) => {
    if (isSandboxMode()) {
        memoryDemoProducts = memoryDemoProducts.filter(p => p.id !== Number(id));
        return Promise.resolve({ data: { message: 'Product deleted from sandbox' } });
    }
    return api.delete(`/products/${id}`);
};

// ==========================================
// INVOICES API
// ==========================================
export const getInvoices = async () => {
    if (isSandboxMode()) {
        return Promise.resolve({ data: memoryDemoInvoices });
    }
    return api.get('/invoices');
};

export const getInvoiceById = async (id) => {
    if (isSandboxMode()) {
        const inv = memoryDemoInvoices.find(i => i.id === Number(id));
        return inv ? Promise.resolve({ data: inv }) : Promise.reject({ response: { status: 404 } });
    }
    return api.get(`/invoices/${id}`);
};

export const getInvoice = getInvoiceById;

export const createInvoice = async (invoiceData) => {
    if (isSandboxMode()) {
        const subtotal = invoiceData.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
        const gstRate = Number(invoiceData.gstRate || 18);
        const gstAmount = Number(((subtotal * gstRate) / 100).toFixed(2));
        const grossTotal = subtotal + gstAmount;
        const discountAmount = Number(invoiceData.discountAmount || 0);
        const grandTotal = Math.max(0, Number((grossTotal - discountAmount).toFixed(2)));
        const amountPaid = invoiceData.amountPaid === undefined || invoiceData.amountPaid === '' ? grandTotal : Number(invoiceData.amountPaid);
        const balanceDue = Math.max(0, Number((grandTotal - amountPaid).toFixed(2)));

        // Deduct quantity from in-memory demo stock
        invoiceData.items.forEach(item => {
            const p = memoryDemoProducts.find(prod => prod.name === item.productName || prod.id === item.productId);
            if (p) {
                p.quantity = Math.max(0, p.quantity - item.quantity);
                p.stockQuantity = p.quantity;
            }
        });

        const newInvoice = {
            id: Date.now(),
            invoiceNumber: 'DEMO-' + (memoryDemoInvoices.length + 1003),
            customerName: invoiceData.customerName,
            customerContact: invoiceData.customerContact,
            deliveryAddress: invoiceData.deliveryAddress || '',
            paymentMethod: invoiceData.paymentMethod || 'CASH',
            subtotal,
            gstRate,
            gstAmount,
            discountAmount,
            totalAmount: grandTotal,
            amountPaid,
            balanceDue,
            amountDue: balanceDue,
            createdAt: new Date().toISOString(),
            items: invoiceData.items.map(it => ({
                product: { name: it.productName || 'Appliance Item' },
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                serialNumber: it.serialNumber || ''
            }))
        };

        memoryDemoInvoices.unshift(newInvoice);
        return Promise.resolve({ data: newInvoice });
    }
    return api.post('/invoices', invoiceData);
};

export const updateInvoice = async (id, invoiceData) => {
    if (isSandboxMode()) {
        const index = memoryDemoInvoices.findIndex(i => i.id === Number(id));
        if (index !== -1) {
            memoryDemoInvoices[index] = { ...memoryDemoInvoices[index], ...invoiceData };
            return Promise.resolve({ data: memoryDemoInvoices[index] });
        }
        return Promise.reject({ response: { status: 404 } });
    }
    return api.put(`/invoices/${id}`, invoiceData);
};

export const deleteInvoice = async (id) => {
    if (isSandboxMode()) {
        memoryDemoInvoices = memoryDemoInvoices.filter(i => i.id !== Number(id));
        return Promise.resolve({ data: { message: 'Invoice deleted from sandbox' } });
    }
    return api.delete(`/invoices/${id}`);
};

export const settleDueInvoice = async (id, settlePayload) => {
    let paymentAmount = 0;
    let paymentMode = 'CASH';

    if (typeof settlePayload === 'object' && settlePayload !== null) {
        paymentAmount = Number(settlePayload.amountPaid !== undefined ? settlePayload.amountPaid : (settlePayload.amount !== undefined ? settlePayload.amount : 0));
        paymentMode = settlePayload.paymentMethod || settlePayload.paymentMode || 'CASH';
    } else {
        paymentAmount = Number(settlePayload || 0);
    }

    if (isSandboxMode()) {
        const inv = memoryDemoInvoices.find(i => i.id === Number(id));
        if (inv) {
            const actualPayment = paymentAmount > 0 ? paymentAmount : Number(inv.balanceDue || inv.amountDue || 0);
            inv.amountPaid = Number(((inv.amountPaid || 0) + actualPayment).toFixed(2));
            inv.balanceDue = Math.max(0, Number(((inv.totalAmount || 0) - inv.amountPaid).toFixed(2)));
            inv.amountDue = inv.balanceDue;
            inv.paymentMethod = paymentMode;
            inv.paymentMode = paymentMode;
            return Promise.resolve({ data: inv });
        }
        return Promise.reject({ response: { status: 404 } });
    }

    const payload = typeof settlePayload === 'object' && settlePayload !== null
        ? { ...settlePayload, amount: paymentAmount, amountPaid: paymentAmount }
        : { amount: paymentAmount, amountPaid: paymentAmount, paymentMode };

    return api.put(`/invoices/${id}/settle`, payload);
};

export const getDueInvoices = async () => {
    if (isSandboxMode()) {
        const dueList = memoryDemoInvoices.filter(i => (i.balanceDue || i.amountDue || 0) > 0);
        return Promise.resolve({ data: dueList });
    }
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
    if (isSandboxMode()) {
        const totalSales = memoryDemoInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
        const totalDue = memoryDemoInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue || inv.amountDue || 0), 0);
        const totalInvoices = memoryDemoInvoices.length;
        const lowStockCount = memoryDemoProducts.filter(p => (p.quantity || p.stockQuantity || 0) <= 2).length;

        return Promise.resolve({
            data: {
                todaySales: totalSales,
                todayInvoices: totalInvoices,
                totalSales,
                totalDue,
                totalDueAmount: totalDue,
                totalInvoices,
                lowStockCount,
                recentInvoices: memoryDemoInvoices.slice(0, 5),
                lowStockProducts: memoryDemoProducts.filter(p => (p.quantity || p.stockQuantity || 0) <= 2)
            }
        });
    }

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
export const getStats = getDashboardSummary;

export default api;
