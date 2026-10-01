/**
 * Standalone Mock API Adapter for Visitor / Demo Sandbox Mode (Issue 12)
 * Decoupled from production API client. Completely ephemeral in memory.
 */

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

let memoryProducts = JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS));
let memoryInvoices = JSON.parse(JSON.stringify(INITIAL_DEMO_INVOICES));

export const demoAdapter = {
    reset() {
        memoryProducts = JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS));
        memoryInvoices = JSON.parse(JSON.stringify(INITIAL_DEMO_INVOICES));
    },

    getProducts() {
        return Promise.resolve({ data: memoryProducts.filter(p => p.active !== false) });
    },

    getProductById(id) {
        const prod = memoryProducts.find(p => p.id === Number(id));
        return prod ? Promise.resolve({ data: prod }) : Promise.reject({ response: { status: 404 } });
    },

    createProduct(productData) {
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
        memoryProducts.unshift(newProduct);
        return Promise.resolve({ data: newProduct });
    },

    updateProduct(id, productData) {
        const idx = memoryProducts.findIndex(p => p.id === Number(id));
        if (idx !== -1) {
            memoryProducts[idx] = {
                ...memoryProducts[idx],
                ...productData,
                price: Number(productData.price || productData.unitPrice || memoryProducts[idx].price),
                unitPrice: Number(productData.price || productData.unitPrice || memoryProducts[idx].price),
                quantity: Number(productData.quantity !== undefined ? productData.quantity : memoryProducts[idx].quantity)
            };
            return Promise.resolve({ data: memoryProducts[idx] });
        }
        return Promise.reject({ response: { status: 404 } });
    },

    deleteProduct(id) {
        memoryProducts = memoryProducts.filter(p => p.id !== Number(id));
        return Promise.resolve({ data: { message: 'Product deleted' } });
    },

    getInvoices() {
        return Promise.resolve({ data: [...memoryInvoices] });
    },

    getInvoiceById(id) {
        const inv = memoryInvoices.find(i => i.id === Number(id));
        return inv ? Promise.resolve({ data: inv }) : Promise.reject({ response: { status: 404 } });
    },

    createInvoice(invoiceData) {
        const subtotal = invoiceData.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice)), 0);
        const discount = Math.min(subtotal, Number(invoiceData.discountAmount || invoiceData.discount || 0));
        const taxable = Math.max(0, subtotal - discount);
        const gstRate = Number(invoiceData.gstRate || 0);
        const gstAmount = Number(((taxable * gstRate) / 100).toFixed(2));
        const total = Number((taxable + gstAmount).toFixed(2));
        const paid = invoiceData.amountPaid === '' || invoiceData.amountPaid === undefined ? total : Number(invoiceData.amountPaid);
        const due = Math.max(0, Number((total - paid).toFixed(2)));

        const newInv = {
            id: Date.now(),
            invoiceNumber: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
            customerName: invoiceData.customerName,
            customerContact: invoiceData.customerContact || 'N/A',
            deliveryAddress: invoiceData.deliveryAddress || 'N/A',
            paymentMethod: invoiceData.paymentMethod || invoiceData.paymentMode || 'CASH',
            subtotal,
            gstRate,
            gstAmount,
            discountAmount: discount,
            totalAmount: total,
            amountPaid: paid,
            balanceDue: due,
            amountDue: due,
            createdAt: new Date().toISOString(),
            items: invoiceData.items.map(it => ({
                product: { name: it.productName || it.name || 'Sample Item' },
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
                serialNumber: it.serialNumber || 'SN-DEMO'
            }))
        };

        memoryInvoices.unshift(newInv);
        return Promise.resolve({ data: newInv });
    },

    updateInvoice(id, invoiceData) {
        const idx = memoryInvoices.findIndex(i => i.id === Number(id));
        if (idx !== -1) {
            memoryInvoices[idx] = { ...memoryInvoices[idx], ...invoiceData };
            return Promise.resolve({ data: memoryInvoices[idx] });
        }
        return Promise.reject({ response: { status: 404 } });
    },

    deleteInvoice(id) {
        memoryInvoices = memoryInvoices.filter(i => i.id !== Number(id));
        return Promise.resolve({ data: { message: 'Invoice deleted' } });
    },

    getDueInvoices() {
        const dues = memoryInvoices.filter(i => Number(i.balanceDue || i.amountDue || 0) > 0);
        return Promise.resolve({ data: dues });
    },

    settleDueInvoice(id, settleData) {
        const idx = memoryInvoices.findIndex(i => i.id === Number(id));
        if (idx !== -1) {
            const inv = memoryInvoices[idx];
            const currentDue = Number(inv.balanceDue || inv.amountDue || 0);
            const paying = Math.min(currentDue, Number(settleData.amountPaid || currentDue));
            const newPaid = Number((Number(inv.amountPaid || 0) + paying).toFixed(2));
            const newDue = Math.max(0, Number((currentDue - paying).toFixed(2)));

            memoryInvoices[idx] = {
                ...inv,
                amountPaid: newPaid,
                balanceDue: newDue,
                amountDue: newDue
            };
            return Promise.resolve({ data: memoryInvoices[idx] });
        }
        return Promise.reject({ response: { status: 404 } });
    },

    getDashboard() {
        const totalSales = memoryInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
        const dueBills = memoryInvoices.filter(i => Number(i.balanceDue || i.amountDue || 0) > 0);
        const totalDue = dueBills.reduce((s, i) => s + Number(i.balanceDue || i.amountDue || 0), 0);

        return Promise.resolve({
            data: {
                todaySales: totalSales,
                todayInvoices: memoryInvoices.length,
                dueInvoicesCount: dueBills.length,
                totalDueAmount: totalDue
            }
        });
    }
};

export default demoAdapter;
