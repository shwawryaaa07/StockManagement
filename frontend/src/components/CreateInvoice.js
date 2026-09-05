import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';

const CATEGORY_TABS = [
    { id: 'ALL', label: 'All Products', icon: '⚡' },
    { id: 'TV', label: 'Smart TVs', icon: '📺' },
    { id: 'REFRIGERATOR', label: 'Refrigerators', icon: '🧊' },
    { id: 'AC', label: 'Air Conditioners', icon: '❄️' },
    { id: 'WASHING_MACHINE', label: 'Washing Machines', icon: '🧺' },
    { id: 'AUDIO', label: 'Audio & Speakers', icon: '🔊' },
    { id: 'KITCHEN', label: 'Kitchen Appliances', icon: '🍳' },
    { id: 'OTHER', label: 'Other', icon: '📦' }
];

function CreateInvoice() {
    const navigate = useNavigate();
    const toast = useToast();

    // Data states
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Invoice Form states
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [items, setItems] = useState([]);
    const [gstRate, setGstRate] = useState(18);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [notes, setNotes] = useState('');

    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const handleSubmitRef = useRef();

    // 1. Load catalog on mount with isMounted guard
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoadingProducts(true);
            try {
                const prodRes = await getProducts();
                if (isMounted && prodRes.data && Array.isArray(prodRes.data)) {
                    setProducts(prodRes.data);
                }
            } catch (error) {
                console.error('Error loading products catalog:', error);
                if (isMounted) toast.error('Failed to load product catalog.');
            } finally {
                if (isMounted) setLoadingProducts(false);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Click outside & Keyboard shortcuts listener (registered once)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        const handleKeyDown = (e) => {
            if (e.key === 'F4') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F2') {
                e.preventDefault();
                handleSubmitRef.current?.();
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                setSearchTerm('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Filter products for category pills & search
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                !searchTerm.trim() ||
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (activeCategory === 'ALL') return true;
            const cat = (p.category || '').toUpperCase();
            if (activeCategory === 'TV' && (cat.includes('TV') || cat.includes('TELEVISION') || cat.includes('LED'))) return true;
            if (activeCategory === 'REFRIGERATOR' && (cat.includes('REF') || cat.includes('FRIDGE'))) return true;
            if (activeCategory === 'AC' && (cat.includes('AC') || cat.includes('AIR') || cat.includes('COOLER'))) return true;
            if (activeCategory === 'WASHING_MACHINE' && (cat.includes('WASH') || cat.includes('LAUNDRY'))) return true;
            if (activeCategory === 'AUDIO' && (cat.includes('AUDIO') || cat.includes('SOUND') || cat.includes('SPEAKER'))) return true;
            if (activeCategory === 'KITCHEN' && (cat.includes('KITCHEN') || cat.includes('MICROWAVE') || cat.includes('OVEN') || cat.includes('CHIMNEY'))) return true;
            if (activeCategory === 'OTHER') return true;

            return cat.includes(activeCategory);
        });
    }, [products, activeCategory, searchTerm]);

    // Autocomplete suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const q = searchTerm.toLowerCase();
        return products.filter(
            (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.modelNumber?.toLowerCase().includes(q)
        ).slice(0, 6);
    }, [products, searchTerm]);

    // Add item to bill
    const addItem = (product) => {
        const availableStock = product.quantity !== undefined ? product.quantity : 999;
        const existingIndex = items.findIndex((item) => item.productId === product.id);

        if (existingIndex > -1) {
            const currentQty = items[existingIndex].quantity;
            if (currentQty >= availableStock) {
                toast.warning(`Only ${availableStock} units of "${product.name}" in stock.`);
                return;
            }
            const updated = [...items];
            updated[existingIndex].quantity += 1;
            setItems(updated);
            toast.info(`Increased "${product.name}" qty to ${updated[existingIndex].quantity}`, 1500);
        } else {
            if (availableStock <= 0) {
                toast.error(`"${product.name}" is OUT OF STOCK!`);
                return;
            }
            setItems([
                ...items,
                {
                    productId: product.id,
                    productName: product.name,
                    modelNumber: product.modelNumber || '',
                    category: product.category || 'General',
                    quantity: 1,
                    unitPrice: Number(product.price) || 0,
                    availableStock: availableStock,
                    serialNumber: ''
                }
            ]);
            toast.success(`Added "${product.name}" to bill`, 1800);
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const updateQuantity = (index, delta) => {
        const updated = [...items];
        const item = updated[index];
        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            removeItem(index);
            return;
        }

        if (item.availableStock && newQty > item.availableStock) {
            toast.warning(`Only ${item.availableStock} units available.`);
            return;
        }

        item.quantity = newQty;
        setItems(updated);
    };

    const handleDirectQuantityChange = (index, val) => {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1) return;
        const updated = [...items];
        const item = updated[index];
        if (item.availableStock && parsed > item.availableStock) {
            toast.warning(`Only ${item.availableStock} units available.`);
            return;
        }
        item.quantity = parsed;
        setItems(updated);
    };

    const removeItem = (index) => {
        const removed = items[index];
        setItems(items.filter((_, i) => i !== index));
        toast.info(`Removed "${removed.productName}" from bill`, 1500);
    };

    const updateSerialNumber = (index, serial) => {
        const updated = [...items];
        updated[index].serialNumber = serial;
        setItems(updated);
    };

    // Calculate Indian GST & Grand Total (Taxable = Subtotal - Discount)
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const discount = Math.min(subtotal, Math.max(0, Number(discountAmount || 0)));
    const taxableAmount = Math.max(0, subtotal - discount);
    const gstAmount = Number(((taxableAmount * Number(gstRate || 0)) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + gstAmount).toFixed(2));

    const actualPaid = amountPaid === '' ? grandTotal : Number(amountPaid);
    const balanceDue = Math.max(0, Number((grandTotal - actualPaid).toFixed(2)));

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!customerName.trim()) {
            toast.warning('Please enter customer name');
            return;
        }

        if (items.length === 0) {
            toast.warning('Please add at least 1 product to the bill');
            return;
        }

        setSubmitting(true);

        const payload = {
            customerName: customerName.trim(),
            customerContact: customerContact.trim() || 'N/A',
            deliveryAddress: deliveryAddress.trim() || 'N/A',
            gstRate: Number(gstRate),
            discount: discount,
            discountAmount: discount,
            paymentMode: paymentMethod,
            paymentMethod: paymentMethod,
            amountPaid: actualPaid,
            notes: notes.trim(),
            items: items.map((item) => ({
                product: { id: item.productId },
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                serialNumber: item.serialNumber || ''
            }))
        };

        try {
            const res = await createInvoice(payload);
            toast.success('Invoice generated successfully!');
            if (res.data && res.data.id) {
                navigate(`/invoice/${res.data.id}`);
            } else {
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            const msg = error.response?.data?.message || 'Failed to generate bill. Please try again.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };
    handleSubmitRef.current = handleSubmit;

    return (
        <div className="page-container" style={{ maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box' }}>
            {/* Top Action Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🧾 <span>Create Tax Invoice</span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500' }}>
                        Press <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F4</kbd> to search products &bull; <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F2</kbd> to generate bill
                    </p>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-cancel"
                        style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Split Screen POS Grid */}
            <div className="pos-grid-layout">
                {/* LEFT COLUMN: Customer Entry & Product Selection / Cart Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* SECTION 1: Customer Information Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        padding: '22px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👤 <span>Customer Details</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Phone Number (WhatsApp Bill)
                        </label>
                        <input
                            type="tel"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            placeholder="Enter 10-digit mobile number"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Delivery Address / Location (Optional)
                        </label>
                        <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter delivery address (optional)"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 2: Product Search & Items Table */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '22px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '20px'
            }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📦 <span>Select Products &amp; Quantities</span>
                </h3>

                {/* Fast Product Search Box with Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '16px' }}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="🔍 Type product name, model number, or scan barcode... (Press F4)"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            borderRadius: '10px',
                            border: '2px solid var(--border-color)',
                            background: 'var(--bg-body)',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box'
                        }}
                    />

                    {/* Instant Suggestions Dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            marginTop: '6px',
                            overflow: 'hidden'
                        }}>
                            {searchSuggestions.map((p) => {
                                const stock = p.quantity !== undefined ? p.quantity : 0;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => addItem(p)}
                                        style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: stock > 0 ? 'pointer' : 'not-allowed',
                                            opacity: stock > 0 ? 1 : 0.6,
                                            background: 'var(--bg-card)'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                                                {p.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {p.category || 'General'} {p.modelNumber ? `• Model: ${p.modelNumber}` : ''}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-accent)' }}>
                                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                            </div>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: stock > 2 ? '#10b981' : stock > 0 ? '#f59e0b' : '#ef4444' }}>
                                                {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Category Pills for quick discovery */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', scrollbarWidth: 'thin' }}>
                    {CATEGORY_TABS.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{ flexShrink: 0 }}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Quick Add Product Grid (Filtered) */}
                {!loadingProducts && filteredProducts.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '12px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '4px',
                        marginBottom: '20px',
                        background: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        {filteredProducts.slice(0, 12).map((prod) => {
                            const stock = prod.quantity !== undefined ? prod.quantity : 0;
                            const isOutOfStock = stock <= 0;
                            return (
                                <div
                                    key={prod.id}
                                    onClick={() => !isOutOfStock && addItem(prod)}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                        opacity: isOutOfStock ? 0.55 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {prod.category || 'General'}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2, margin: '2px 0 4px' }}>
                                            {prod.name}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-accent)' }}>
                                            ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: stock > 2 ? '#10b981' : stock > 0 ? '#f59e0b' : '#ef4444' }}>
                                            {stock > 0 ? `+ Add (${stock})` : 'Out'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Items Table */}
                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>No Items Added to Invoice</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>Click on a product card above or search to add items</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px' }}>#</th>
                                    <th style={{ padding: '10px 12px' }}>Product &amp; Serial Number</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Quantity</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (₹)</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                {item.productName}
                                            </div>
                                            {item.modelNumber && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Model: {item.modelNumber}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={item.serialNumber}
                                                onChange={(e) => updateSerialNumber(idx, e.target.value)}
                                                placeholder="Enter unit serial number (optional)"
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '240px',
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-body)',
                                                    color: 'var(--text-primary)',
                                                    marginTop: '4px'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                                            ₹{item.unitPrice.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <button
                                                    type="button"
                                                    className="qty-control-btn"
                                                    onClick={() => updateQuantity(idx, -1)}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleDirectQuantityChange(idx, e.target.value)}
                                                    style={{
                                                        width: '42px',
                                                        textAlign: 'center',
                                                        padding: '4px 2px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-body)',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: '800'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="qty-control-btn"
                                                    onClick={() => updateQuantity(idx, 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: 'var(--primary-accent)' }}>
                                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    padding: '4px'
                                                }}
                                                title="Remove Item"
                                            >
                                                ✕
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

            {/* RIGHT COLUMN: Money Related Details (Totals, Taxes, Payment & Settlement) */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '22px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 <span>Bill Summary &amp; Payment</span>
                    </h4>

                    {/* Totals Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                            <span style={{ fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Special Discount (₹):</span>
                            <input
                                type="number"
                                min="0"
                                max={subtotal}
                                step="1"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                style={{
                                    width: '100px',
                                    padding: '5px 10px',
                                    fontSize: '13px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    textAlign: 'right',
                                    fontWeight: '700'
                                }}
                            />
                        </div>

                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
                                <span>Taxable Amount (Net):</span>
                                <span style={{ fontWeight: '800' }}>₹{taxableAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>GST Rate:</span>
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
                                <option value={0}>0% (Tax Exempt)</option>
                                <option value={5}>5% GST</option>
                                <option value={12}>12% GST</option>
                                <option value={18}>18% GST (Standard)</option>
                                <option value={28}>28% GST</option>
                            </select>
                        </div>

                        {gstRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>GST Amount ({gstRate}%):</span>
                                <span style={{ fontWeight: '700' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '10px',
                            marginTop: '4px',
                            borderTop: '2px dashed var(--border-color)'
                        }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)' }}>Grand Total:</span>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gold)' }}>
                                ₹{grandTotal.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid var(--border-color)' }} />

                    {/* Payment Method */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Payment Method
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { id: 'CASH', label: '💵 Cash' },
                                { id: 'UPI', label: '📱 UPI / QR' },
                                { id: 'CARD', label: '💳 Card' },
                                { id: 'BANK_TRANSFER', label: '🏦 Net Banking' }
                            ].map((pm) => (
                                <button
                                    key={pm.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(pm.id)}
                                    style={{
                                        padding: '9px 10px',
                                        borderRadius: '8px',
                                        fontSize: '12.5px',
                                        fontWeight: '700',
                                        border: '1px solid',
                                        borderColor: paymentMethod === pm.id ? 'var(--gold)' : 'var(--border-color)',
                                        background: paymentMethod === pm.id ? 'var(--gold-light)' : 'var(--bg-body)',
                                        color: paymentMethod === pm.id ? '#92400e' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    {pm.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Collected */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                Amount Received / Collected (₹)
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setAmountPaid(String(grandTotal))}
                                    style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '4px', fontSize: '11px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    100% Paid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAmountPaid('0')}
                                    style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', fontSize: '11px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Full Due
                                </button>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="Enter amount collected (₹)"
                            min="0"
                            step="0.01"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '15px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                fontWeight: '800',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Balance Due Alert */}
                    {balanceDue > 0 && (
                        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b91c1c', fontWeight: '800' }}>
                            <span>⚠️ Balance Due (Credit):</span>
                            <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {/* Remarks / Notes */}
                    <div>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter bill remarks or warranty notes (optional)"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Primary Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || items.length === 0}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: '900',
                            marginTop: '4px'
                        }}
                    >
                        {submitting ? 'Generating Invoice...' : `✅ Collect ₹${actualPaid.toLocaleString('en-IN')} & Print Invoice (F2)`}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}

export default CreateInvoice;
