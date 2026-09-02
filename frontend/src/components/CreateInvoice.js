import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ProductGridSkeleton } from './SkeletonLoader';

const CATEGORY_TABS = [
    { id: 'ALL', label: '⚡ All Products', icon: '🏪' },
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

    // Filter states
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

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

    // Initial load
    useEffect(() => {
        loadData();

        // Keyboard Shortcuts: F4 = Search, F2 = Checkout, Esc = Clear
        const handleKeyDown = (e) => {
            if (e.key === 'F4') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F2') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'Escape') {
                setSearchTerm('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, customerName, amountPaid, discountAmount, gstRate, paymentMethod]);

    const loadData = async () => {
        setLoadingProducts(true);
        try {
            const prodRes = await getProducts();
            if (prodRes.data && Array.isArray(prodRes.data)) {
                setProducts(prodRes.data);
            }
        } catch (error) {
            console.error('Error loading POS catalog:', error);
            toast.error('Failed to load product catalog. Please refresh.');
        } finally {
            setLoadingProducts(false);
        }
    };

    // Filter products by category & search term
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

    // Add item to billing cart
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
            toast.info(`Increased "${product.name}" to ${updated[existingIndex].quantity}`, 1500);
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
                    category: product.category || 'General',
                    quantity: 1,
                    unitPrice: Number(product.price) || 0,
                    availableStock: availableStock,
                    serialNumber: ''
                }
            ]);
            toast.success(`Added "${product.name}" to bill`, 1800);
        }
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

    // Calculate Indian GST & Grand Total
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
            toast.error('Please enter customer name');
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

    return (
        <div className="pos-container">
            {/* Top POS Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🧾 <span>Fast POS Counter</span>
                    </h1>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500' }}>
                        Press <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F4</kbd> to search &bull; <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F2</kbd> to complete sale
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-cancel"
                        style={{ padding: '10px 16px', fontSize: '13px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || items.length === 0}
                        className="btn-primary"
                        style={{ padding: '10px 22px', fontSize: '14px', fontWeight: '800' }}
                    >
                        {submitting ? 'Generating...' : '🖨️ Complete & Print Bill (F2)'}
                    </button>
                </div>
            </div>

            {/* 2-Column POS Layout */}
            <div className="pos-grid-layout">
                {/* LEFT COLUMN: Catalog & Touch Grid */}
                <div className="pos-catalog-panel">
                    {/* Search & Barcode Input */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="🔍 Scan barcode or search product name / model... (F4)"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '14px',
                                borderRadius: '10px',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                &times;
                            </button>
                        )}
                    </div>

                    {/* Category Tabs */}
                    <div className="category-tabs-scroll">
                        {CATEGORY_TABS.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Visual Product Grid */}
                    {loadingProducts ? (
                        <ProductGridSkeleton count={8} />
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
                            <div style={{ fontWeight: '700', fontSize: '15px' }}>No matching products found</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Try searching by different keyword or category</div>
                        </div>
                    ) : (
                        <div className="product-touch-grid">
                            {filteredProducts.map((prod) => {
                                const stock = prod.quantity !== undefined ? prod.quantity : 0;
                                const isOutOfStock = stock <= 0;
                                const isLowStock = stock > 0 && stock <= 2;

                                return (
                                    <div
                                        key={prod.id}
                                        className={`product-touch-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                                        onClick={() => !isOutOfStock && addItem(prod)}
                                        title={isOutOfStock ? 'Out of Stock' : `Click to add ${prod.name}`}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    {prod.category || 'General'}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '10px',
                                                        fontWeight: '800',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#d1fae5',
                                                        color: isOutOfStock ? '#991b1b' : isLowStock ? '#92400e' : '#065f46'
                                                    }}
                                                >
                                                    {isOutOfStock ? 'Out of Stock' : `${stock} Left`}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '4px' }}>
                                                {prod.name}
                                            </div>
                                            {prod.modelNumber && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                    Model: {prod.modelNumber}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                            <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--primary-accent)' }}>
                                                ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                                            </div>
                                            <span style={{ fontSize: '18px', color: 'var(--gold)', fontWeight: 'bold' }}>+</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Live Bill & Checkout */}
                <div className="pos-bill-sticky-panel">
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🧾 Current Bill</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </h3>

                    {/* Customer Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="👤 Customer Name *"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <input
                            type="tel"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            placeholder="📱 Phone (WhatsApp)"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="📍 Delivery Address / Town (optional)"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="📝 Bill remarks / warranty notes (optional)"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Cart Items List */}
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '10px', margin: '10px 0' }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛒</div>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>Bill is empty</div>
                            <div style={{ fontSize: '11px' }}>Click on products to add them</div>
                        </div>
                    ) : (
                        <div className="cart-items-scroll">
                            {items.map((item, idx) => (
                                <div key={idx} className="cart-item-row">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.productName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            ₹{item.unitPrice.toLocaleString('en-IN')} &times; {item.quantity} = ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                                        </div>
                                        <input
                                            type="text"
                                            value={item.serialNumber}
                                            onChange={(e) => updateSerialNumber(idx, e.target.value)}
                                            placeholder="Serial # (optional)"
                                            style={{
                                                width: '90%',
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-body)',
                                                color: 'var(--text-primary)',
                                                marginTop: '4px'
                                            }}
                                        />
                                    </div>

                                    {/* Stepper Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button type="button" className="qty-control-btn" onClick={() => updateQuantity(idx, -1)}>
                                            -
                                        </button>
                                        <span style={{ fontSize: '13px', fontWeight: '800', minWidth: '18px', textAlign: 'center' }}>
                                            {item.quantity}
                                        </span>
                                        <button type="button" className="qty-control-btn" onClick={() => updateQuantity(idx, 1)}>
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', marginLeft: '4px' }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bill Breakdown */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
                            <span style={{ fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Discount Input */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Discount (₹):</span>
                            <input
                                type="number"
                                min="0"
                                max={subtotal}
                                step="1"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                style={{
                                    width: '90px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#10b981' }}>
                                <span>Taxable Amount:</span>
                                <span style={{ fontWeight: '700' }}>₹{taxableAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        {/* GST Selector */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GST Rate:</span>
                            <select
                                value={gstRate}
                                onChange={(e) => setGstRate(Number(e.target.value))}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}
                            >
                                <option value={0}>0% (Exempt)</option>
                                <option value={5}>5% GST</option>
                                <option value={12}>12% GST</option>
                                <option value={18}>18% (Standard)</option>
                                <option value={28}>28% GST</option>
                            </select>
                        </div>

                        {gstRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>GST Amount ({gstRate}%):</span>
                                <span style={{ fontWeight: '600' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '2px dashed var(--border-color)', borderBottom: '2px dashed var(--border-color)' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800' }}>Grand Total:</span>
                            <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)' }}>
                                ₹{grandTotal.toLocaleString('en-IN')}
                            </span>
                        </div>

                        {/* Payment Method Quick Buttons */}
                        <div style={{ marginTop: '6px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Payment Mode
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
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
                                            padding: '7px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11.5px',
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

                        {/* Amount Received / Paid */}
                        <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                    Amount Received (₹)
                                </label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAmountPaid(String(grandTotal))}
                                        style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '4px', fontSize: '10px', padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        100% Paid
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAmountPaid('0')}
                                        style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', fontSize: '10px', padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Full Due
                                    </button>
                                </div>
                            </div>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                placeholder={`Exact ₹${grandTotal}`}
                                min="0"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontWeight: '700'
                                }}
                            />
                        </div>

                        {balanceDue > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>
                                <span>⚠️ Balance Due:</span>
                                <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        {/* Complete Checkout Button */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || items.length === 0}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '14px',
                                fontWeight: '900',
                                marginTop: '10px'
                            }}
                        >
                            {submitting ? 'Generating Bill...' : `✅ Collect ₹${actualPaid.toLocaleString('en-IN')} & Print (F2)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateInvoice;
