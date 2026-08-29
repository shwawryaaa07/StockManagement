import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getInvoices, createInvoice } from '../services/api';

function CreateInvoice() {
    const navigate = useNavigate();

    // Data lists
    const [products, setProducts] = useState([]);
    const [pastCustomers, setPastCustomers] = useState([]);

    // Form states
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [gstRate, setGstRate] = useState(18);
    const [discount, setDiscount] = useState('');
    const [items, setItems] = useState([]);

    // Product search state
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        loadData().catch(console.error);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, invRes] = await Promise.all([
                getProducts(),
                getInvoices()
            ]);
            setProducts(prodRes.data || []);

            // Extract unique customer suggestions from previous invoices
            if (invRes.data && Array.isArray(invRes.data)) {
                const map = new Map();
                invRes.data.forEach(inv => {
                    if (inv.customerName && inv.customerName !== 'N/A') {
                        if (!map.has(inv.customerName.toLowerCase())) {
                            map.set(inv.customerName.toLowerCase(), {
                                name: inv.customerName,
                                contact: inv.customerContact === 'N/A' ? '' : (inv.customerContact || ''),
                                address: inv.deliveryAddress === 'N/A' ? '' : (inv.deliveryAddress || '')
                            });
                        }
                    }
                });
                setPastCustomers(Array.from(map.values()));
            }
        } catch (error) {
            console.error('Error loading initial billing data:', error);
        }
    };

    // Filter products for search
    const filteredProducts = products.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
        );
    });

    // Add product to bill and collapse suggestions
    const addProductToBill = (product) => {
        if (product.quantity <= 0) {
            alert(`⚠️ "${product.name}" is out of stock!`);
            return;
        }

        const existingIndex = items.findIndex(i => i.product.id === product.id);
        if (existingIndex > -1) {
            const currentQty = items[existingIndex].quantity;
            if (currentQty + 1 > product.quantity) {
                alert(`⚠️ Only ${product.quantity} items available in stock!`);
                return;
            }
            const updated = [...items];
            updated[existingIndex].quantity += 1;
            setItems(updated);
        } else {
            const serialsList = (product.serialNumbers || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            setItems([
                ...items,
                {
                    product: product,
                    quantity: 1,
                    unitPrice: Number(product.price || 0),
                    modelNumber: product.modelNumber || '',
                    serialNumber: '',
                    availableSerials: serialsList
                }
            ]);
        }

        // Clean query and collapse suggestions
        setSearchQuery('');
        setShowSuggestions(false);
    };

    // Update quantity with stepper
    const updateQuantity = (index, delta) => {
        const item = items[index];
        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            removeItem(index);
            return;
        }

        if (newQty > item.product.quantity) {
            alert(`⚠️ Only ${item.product.quantity} units available in stock!`);
            return;
        }

        const updated = [...items];
        updated[index].quantity = newQty;
        setItems(updated);
    };

    // Direct quantity input change
    const handleDirectQuantityChange = (index, val) => {
        const parsed = parseInt(val, 10);
        const item = items[index];
        if (isNaN(parsed) || parsed < 1) return;

        if (parsed > item.product.quantity) {
            alert(`⚠️ Only ${item.product.quantity} units available in stock!`);
            return;
        }

        const updated = [...items];
        updated[index].quantity = parsed;
        setItems(updated);
    };

    // Update unit price on the fly
    const handleUnitPriceChange = (index, val) => {
        const price = parseFloat(val);
        const updated = [...items];
        updated[index].unitPrice = isNaN(price) ? 0 : price;
        setItems(updated);
    };

    // Remove item from bill
    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Select customer from past history
    const selectPastCustomer = (cust) => {
        setCustomerName(cust.name);
        setCustomerContact(cust.contact);
        setDeliveryAddress(cust.address);
    };

    // Financial calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = Math.round(subtotal * (gstRate / 100));
    const discountVal = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, Math.round(subtotal + gstAmount - discountVal));

    const paidNum = parseFloat(amountPaid) || 0;
    const balanceDue = Math.max(0, grandTotal - paidNum);

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim()) {
            alert('⚠️ Please enter the Customer Name.');
            return;
        }

        const cleanedContact = customerContact.trim();
        if (cleanedContact && cleanedContact.length !== 10) {
            alert('⚠️ Contact number must be exactly 10 digits.');
            return;
        }

        if (items.length === 0) {
            alert('⚠️ Please add at least one product to the invoice.');
            return;
        }

        setLoading(true);

        const payload = {
            customerName: customerName.trim(),
            customerContact: cleanedContact || 'N/A',
            deliveryAddress: deliveryAddress.trim() || 'N/A',
            paymentMode,
            amountPaid: parseFloat(amountPaid) || 0,
            gstRate: parseFloat(gstRate) || 0,
            discount: discountVal,
            items: items.map(i => ({
                product: { id: i.product.id },
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                modelNumber: i.modelNumber || i.product.modelNumber || '',
                serialNumber: i.serialNumber || ''
            }))
        };

        try {
            const res = await createInvoice(payload);
            navigate(`/invoice/${res.data.id}`);
        } catch (error) {
            console.error('Error creating invoice:', error);
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            alert('❌ Failed to create invoice: ' + (apiMessage || fallbackMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⚡ <span>New Point-of-Sale (POS) Invoice</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Quick counter checkout with serial numbers &amp; instant billing
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-cancel"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                        style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {loading ? 'Creating Bill...' : '🖨️ Create & Print Invoice'}
                    </button>
                </div>
            </div>

            {/* 2-Column POS Layout */}
            <div className="pos-grid-container">
                {/* LEFT COLUMN: Customer + Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* 1. Customer Details Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                                👤 Customer Information
                            </h3>
                            {pastCustomers.length > 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Recent: {pastCustomers.slice(0, 3).map((c, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => selectPastCustomer(c)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary)',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                marginLeft: '6px'
                                            }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </span>
                            )}
                        </div>

                        <div className="customer-info-grid">
                            {/* Customer Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Customer Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter customer name"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Phone / Mobile Number (10 Digits)
                                </label>
                                <input
                                    type="tel"
                                    value={customerContact}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setCustomerContact(clean);
                                    }}
                                    placeholder="Enter phone number"
                                    maxLength="10"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div style={{ marginTop: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Delivery / Village Address
                            </label>
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="e.g. Near Bus Stand, Valpoi, Sattari - Goa"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    </div>

                    {/* 2. Search & Add Product Bar */}
                    <div
                        ref={dropdownRef}
                        style={{
                            background: 'var(--bg-card)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)' }}>
                                🔍 Add Items to Bill
                            </label>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Type name, model, or click to browse
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Search products (e.g. AMSTRAD AC, Samsung TV, Refrigerator...)"
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    border: '2px solid var(--primary)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            {showSuggestions && (
                                <button
                                    type="button"
                                    onClick={() => setShowSuggestions(false)}
                                    className="btn-cancel"
                                    style={{ padding: '0 16px', fontSize: '13px' }}
                                >
                                    ✕ Close
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown / Autocomplete popup */}
                        {showSuggestions && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '20px',
                                right: '20px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                zIndex: 100,
                                maxHeight: '280px',
                                overflowY: 'auto',
                                marginTop: '4px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <span>Available Inventory ({filteredProducts.length})</span>
                                    <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowSuggestions(false)}>✕ Close</span>
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                        No products matching "{searchQuery}"
                                    </div>
                                ) : (
                                    filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => addProductToBill(p)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 14px',
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                background: 'transparent',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 35, 126, 0.08)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                                                    {p.name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {p.modelNumber && <span>Model: {p.modelNumber} • </span>}
                                                    {p.category || 'General'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                                                    ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                                </div>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: (p.quantity || 0) <= 2 ? 'rgba(239, 83, 80, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                                                    color: (p.quantity || 0) <= 2 ? '#c62828' : '#2e7d32'
                                                }}>
                                                    {(p.quantity || 0) <= 0 ? 'Out of stock' : `${p.quantity} in stock`}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Selected Line Items Table */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                                📋 Selected Bill Items ({items.length})
                            </h3>
                            {items.length > 0 && (
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Total Quantity: {items.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                border: '2px dashed var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-muted)'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>No items in this bill yet</div>
                                <p style={{ fontSize: '12px', margin: 0 }}>
                                    Click the search bar above to select a product.
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--primary)', color: '#ffffff' }}>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '40px' }}>#</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item &amp; S/N Details</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Unit Price (₹)</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Quantity</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Total (₹)</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'top' }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                        {item.product.name}
                                                    </div>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        Stock: {item.product.quantity} | {item.product.category || 'General'}
                                                    </span>

                                                    {/* Model & Serial No Inputs */}
                                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <div style={{ flex: 1, minWidth: '130px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Model No (e.g. Ams:1833)"
                                                                value={item.modelNumber || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...items];
                                                                    updated[index].modelNumber = e.target.value;
                                                                    setItems(updated);
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '5px 8px',
                                                                    fontSize: '11px',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '5px',
                                                                    background: 'var(--bg-body)',
                                                                    color: 'var(--text-primary)'
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1.6, minWidth: '180px' }}>
                                                            {item.availableSerials && item.availableSerials.length > 0 ? (
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <select
                                                                        value={item.serialNumber || ''}
                                                                        onChange={(e) => {
                                                                            const updated = [...items];
                                                                            updated[index].serialNumber = e.target.value;
                                                                            setItems(updated);
                                                                        }}
                                                                        style={{
                                                                            padding: '5px 6px',
                                                                            fontSize: '11px',
                                                                            border: '1px solid var(--border-color)',
                                                                            borderRadius: '5px',
                                                                            background: 'var(--bg-body)',
                                                                            color: 'var(--text-primary)',
                                                                            maxWidth: '110px'
                                                                        }}
                                                                    >
                                                                        <option value="">Select S/N</option>
                                                                        {item.availableSerials.map((sn, sIdx) => (
                                                                            <option key={sIdx} value={sn}>{sn}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="or scan/type S/N"
                                                                        value={item.serialNumber || ''}
                                                                        onChange={(e) => {
                                                                            const updated = [...items];
                                                                            updated[index].serialNumber = e.target.value;
                                                                            setItems(updated);
                                                                        }}
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: '5px 8px',
                                                                            fontSize: '11px',
                                                                            border: '1px solid var(--border-color)',
                                                                            borderRadius: '5px',
                                                                            background: 'var(--bg-body)',
                                                                            color: 'var(--text-primary)'
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Serial No / S/N (e.g. QA507B26NLZ)"
                                                                    value={item.serialNumber || ''}
                                                                    onChange={(e) => {
                                                                        const updated = [...items];
                                                                        updated[index].serialNumber = e.target.value;
                                                                        setItems(updated);
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '5px 8px',
                                                                        fontSize: '11px',
                                                                        border: '1px solid var(--border-color)',
                                                                        borderRadius: '5px',
                                                                        background: 'var(--bg-body)',
                                                                        color: 'var(--text-primary)'
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', verticalAlign: 'top' }}>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                        style={{
                                                            width: '85px',
                                                            padding: '6px 8px',
                                                            textAlign: 'right',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '6px',
                                                            background: 'var(--bg-body)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '13px'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(index, -1)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                background: 'var(--bg-body)',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-primary)',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleDirectQuantityChange(index, e.target.value)}
                                                            min="1"
                                                            style={{
                                                                width: '36px',
                                                                textAlign: 'center',
                                                                border: 'none',
                                                                borderLeft: '1px solid var(--border-color)',
                                                                borderRight: '1px solid var(--border-color)',
                                                                background: 'transparent',
                                                                color: 'var(--text-primary)',
                                                                fontWeight: 'bold',
                                                                fontSize: '13px'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(index, 1)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                background: 'var(--bg-body)',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-primary)',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)', verticalAlign: 'top' }}>
                                                    ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#c62828',
                                                            cursor: 'pointer',
                                                            fontSize: '16px'
                                                        }}
                                                        title="Remove product"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Bill Summary Card */}
                <div className="pos-summary-card" style={{
                    background: 'var(--bg-card)',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow)'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 <span>Bill Summary &amp; Checkout</span>
                    </h3>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Subtotal (Taxable):</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                ₹{subtotal.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>GST Rate:</span>
                            <select
                                value={gstRate}
                                onChange={(e) => setGstRate(Number(e.target.value))}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            >
                                <option value={0}>0% (Exempt)</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18% (Standard)</option>
                                <option value={28}>28%</option>
                            </select>
                        </div>

                        {gstRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>GST Amount ({gstRate}%):</span>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    ₹{gstAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Special Discount (₹):</span>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                placeholder="0"
                                min="0"
                                style={{
                                    width: '100px',
                                    padding: '5px 8px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: '2px dashed var(--border-color)'
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Grand Total:
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>
                            ₹{grandTotal.toLocaleString('en-IN')}
                        </span>
                    </div>

                    {/* Payment Mode */}
                    <div style={{ marginTop: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                            Payment Method
                        </label>
                        <select
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <option value="CASH">💵 Cash</option>
                            <option value="UPI">📱 UPI / QR Code</option>
                            <option value="CARD">💳 Card (Debit/Credit)</option>
                            <option value="BANK_TRANSFER">🏦 Net Banking / NEFT</option>
                        </select>
                    </div>

                    {/* Amount Received / Paid */}
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                Amount Received Today (₹)
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setAmountPaid(String(grandTotal))}
                                    style={{
                                        background: '#e8f5e9',
                                        color: '#2e7d32',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    100% Paid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAmountPaid('0')}
                                    style={{
                                        background: '#ffebee',
                                        color: '#c62828',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Full Due
                                </button>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                fontSize: '15px',
                                fontWeight: '700'
                            }}
                        />
                    </div>

                    {/* Due Amount Status */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: balanceDue > 0 ? 'rgba(239, 83, 80, 0.12)' : 'rgba(76, 175, 80, 0.12)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: balanceDue > 0 ? '#c62828' : '#2e7d32' }}>
                            {balanceDue > 0 ? '⚠️ Pending Due Amount:' : '✅ Payment Status:'}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: balanceDue > 0 ? '#c62828' : '#2e7d32' }}>
                            {balanceDue > 0 ? `₹${balanceDue.toLocaleString('en-IN')}` : 'FULLY PAID'}
                        </span>
                    </div>

                    {/* Submit Action */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            marginTop: '20px',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '800',
                            borderRadius: '10px',
                            boxShadow: '0 4px 14px rgba(26, 35, 126, 0.3)'
                        }}
                    >
                        {loading ? 'Processing...' : '⚡ Generate Tax Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateInvoice;
