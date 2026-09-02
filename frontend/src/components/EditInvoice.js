import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoice, getProducts, updateInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';

function EditInvoice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    // Data lists
    const [products, setProducts] = useState([]);
    const [invoiceNumber, setInvoiceNumber] = useState('');

    // Form states
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [amountPaid, setAmountPaid] = useState('');
    const [gstRate, setGstRate] = useState(18);
    const [items, setItems] = useState([]);

    // Product search state
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadData = async () => {
        try {
            const [prodRes, invRes] = await Promise.all([
                getProducts(),
                getInvoice(id)
            ]);

            const loadedProducts = prodRes.data || [];
            setProducts(loadedProducts);

            const inv = invRes.data;
            if (inv) {
                setInvoiceNumber(inv.invoiceNumber || `INV-${id}`);
                setCustomerName(inv.customerName || '');
                setCustomerContact(inv.customerContact === 'N/A' ? '' : (inv.customerContact || ''));
                setDeliveryAddress(inv.deliveryAddress === 'N/A' ? '' : (inv.deliveryAddress || ''));
                setPaymentMode(inv.paymentMode || inv.paymentMethod || 'CASH');
                setDiscountAmount(inv.discount !== undefined ? inv.discount : (inv.discountAmount !== undefined ? inv.discountAmount : 0));
                setAmountPaid(String(inv.amountPaid !== undefined ? inv.amountPaid : ''));
                setGstRate(inv.gstRate !== undefined ? inv.gstRate : 0);

                if (inv.items && Array.isArray(inv.items)) {
                    setItems(inv.items.map(item => {
                        const matchedProduct = loadedProducts.find(p => p.id === (item.product?.id || item.product));
                        const serialsList = (matchedProduct?.serialNumbers || '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);

                        return {
                            product: matchedProduct || item.product || { id: item.productId, name: 'Product', price: item.unitPrice, quantity: 99 },
                            quantity: Number(item.quantity || 1),
                            unitPrice: Number(item.unitPrice || 0),
                            modelNumber: item.modelNumber || matchedProduct?.modelNumber || '',
                            serialNumber: item.serialNumber || '',
                            availableSerials: serialsList
                        };
                    }));
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading invoice data:', error);
            toast.error('Error loading invoice details: ' + (error.response?.data?.message || error.message));
            setLoading(false);
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
        const existingIndex = items.findIndex(i => (i.product?.id || i.product) === product.id);

        if (existingIndex > -1) {
            const currentQty = items[existingIndex].quantity;
            if (product.quantity && currentQty >= product.quantity) {
                toast.warning(`Only ${product.quantity} units available in stock!`);
                return;
            }
            const updated = [...items];
            updated[existingIndex].quantity += 1;
            setItems(updated);
        } else {
            if (product.quantity && product.quantity < 1) {
                toast.error(`"${product.name}" is currently OUT OF STOCK!`);
                return;
            }
            const serialsList = (product.serialNumbers || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            setItems([
                ...items,
                {
                    product,
                    quantity: 1,
                    unitPrice: product.price,
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

        if (newQty < 1) {
            removeItem(index);
            return;
        }

        if (item.product?.quantity && newQty > item.product.quantity) {
            toast.warning(`Only ${item.product.quantity} units available in stock!`);
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

        if (item.product?.quantity && parsed > item.product.quantity) {
            toast.warning(`Only ${item.product.quantity} units available in stock!`);
            return;
        }

        const updated = [...items];
        updated[index].quantity = parsed;
        setItems(updated);
    };

    // Remove item
    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Billing calculations (Taxable = Subtotal - Discount)
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = Math.min(subtotal, Math.max(0, parseFloat(discountAmount) || 0));
    const taxableAmount = Math.max(0, subtotal - discount);
    const gstAmount = Number(((taxableAmount * (parseFloat(gstRate) || 0)) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + gstAmount).toFixed(2));

    const paidNum = parseFloat(amountPaid) || 0;
    const balanceDue = Math.max(0, Number((grandTotal - paidNum).toFixed(2)));

    // Save changes
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim()) {
            toast.warning('Please enter customer name');
            return;
        }

        const cleanedContact = customerContact.trim();
        if (cleanedContact && cleanedContact.length !== 10) {
            toast.warning('Contact number must be exactly 10 digits');
            return;
        }

        if (items.length === 0) {
            toast.warning('Please add at least one product to the invoice');
            return;
        }

        setSaving(true);

        const payload = {
            customerName: customerName.trim(),
            customerContact: cleanedContact || 'N/A',
            deliveryAddress: deliveryAddress.trim() || 'N/A',
            paymentMode,
            paymentMethod: paymentMode,
            discount: discount,
            discountAmount: discount,
            amountPaid: parseFloat(amountPaid) || 0,
            gstRate: parseFloat(gstRate) || 0,
            items: items.map(i => ({
                product: { id: i.product?.id || i.product },
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                modelNumber: i.modelNumber || '',
                serialNumber: i.serialNumber || ''
            }))
        };

        try {
            await updateInvoice(id, payload);
            toast.success('Invoice updated successfully!');
            navigate(`/invoice/${id}`);
        } catch (error) {
            console.error('Error updating invoice:', error);
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            toast.error('Error saving invoice: ' + (apiMessage || fallbackMessage));
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 20px', maxWidth: '1350px', margin: '0 auto' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Loading invoice details...</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '24px 20px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✏️ <span>Edit Invoice: <span style={{ color: 'var(--primary)' }}>{invoiceNumber}</span></span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Modify items, model numbers, serial numbers, customer info, or payment terms
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => navigate(`/invoice/${id}`)}
                        className="btn-cancel"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-primary"
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </div>
            </div>

            {/* 2-Column POS Layout */}
            <div className="pos-grid-container">
                {/* LEFT COLUMN: Customer + Search + Items Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Customer Info Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)'
                    }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            👤 <span>Customer Information</span>
                        </h3>

                        <div className="customer-info-grid">
                            {/* Customer Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Phone Number (10 Digits)
                                </label>
                                <input
                                    type="tel"
                                    value={customerContact}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setCustomerContact(clean);
                                    }}
                                    placeholder="Enter 10-digit mobile no"
                                    maxLength="10"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div style={{ marginTop: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Delivery / Billing Address
                            </label>
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="Delivery / Billing Address"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Product Search & Add Section */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)',
                        position: 'relative'
                    }} ref={dropdownRef}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📦 <span>Add / Search Products</span>
                        </h3>

                        {/* Autocomplete Input */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                placeholder="🔍 Click or type to search products by name or category..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid var(--primary)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            />

                            {/* Dropdown Suggestions List */}
                            {showSuggestions && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                                    zIndex: 100
                                }}>
                                    {filteredProducts.length === 0 ? (
                                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                            No products found matching "{searchQuery}"
                                        </div>
                                    ) : (
                                        filteredProducts.map((p) => {
                                            const isOutOfStock = (p.quantity || 0) <= 0;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => !isOutOfStock && addProductToBill(p)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderBottom: '1px solid var(--border-color)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                        opacity: isOutOfStock ? 0.6 : 1,
                                                        background: 'transparent',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isOutOfStock) e.currentTarget.style.background = 'rgba(26, 35, 126, 0.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isOutOfStock) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                            {p.name}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            {p.modelNumber && <span>Model: {p.modelNumber} • </span>}
                                                            {p.category || 'General'}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                                                            ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: isOutOfStock ? '#c62828' : '#2e7d32', fontWeight: '600' }}>
                                                            {isOutOfStock ? 'Out of stock' : `${p.quantity} in stock`}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Added Bill Line Items Table */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                🧾 Bill Items ({items.length})
                            </h3>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setItems([])}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#c62828',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                                <div style={{ fontWeight: '600' }}>No products added to this bill yet.</div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Use the search box above to add items.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--primary)', color: '#ffffff' }}>
                                            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item &amp; S/N Details</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>Quantity</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Rate (₹)</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Amount (₹)</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '50px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => {
                                            const total = item.quantity * item.unitPrice;
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                            {item.product?.name || 'Product'}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            {item.product?.category || 'General'}
                                                        </div>

                                                        {/* Model & Serial No Inputs */}
                                                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <div style={{ flex: 1, minWidth: '130px' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Model number (optional)"
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
                                                                            placeholder="Or type custom S/N"
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
                                                                        placeholder="Serial number / S/N (optional)"
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
                                                    <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'top' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(index, -1)}
                                                                style={{ padding: '4px 8px', background: 'var(--bg-body)', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold' }}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                min="1"
                                                                onChange={(e) => handleDirectQuantityChange(index, e.target.value)}
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
                                                                style={{ padding: '4px 8px', background: 'var(--bg-body)', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold' }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)', verticalAlign: 'top' }}>
                                                        ₹{item.unitPrice.toLocaleString('en-IN')}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', verticalAlign: 'top' }}>
                                                        ₹{total.toLocaleString('en-IN')}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'top' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '16px' }}
                                                            title="Remove Item"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Billing Summary Card */}
                <div className="pos-summary-card" style={{
                    background: 'var(--bg-card)',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow)'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 <span>Billing &amp; Payment</span>
                    </h3>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                ₹{subtotal.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Discount (₹):</span>
                            <input
                                type="number"
                                min="0"
                                max={subtotal}
                                step="1"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                style={{
                                    width: '100px',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    textAlign: 'right'
                                }}
                            />
                        </div>

                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                                <span>Taxable Amount:</span>
                                <span style={{ fontWeight: '700' }}>₹{taxableAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

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
                                Amount Paid (₹)
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
                        disabled={saving}
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
                        {saving ? 'Saving...' : '💾 Update Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditInvoice;
