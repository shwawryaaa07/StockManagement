import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createInvoice } from '../services/api';

function CreateInvoice() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [items, setItems] = useState([]);
    const [gstRate, setGstRate] = useState(18);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
            const prodRes = await getProducts();
            if (prodRes.data && Array.isArray(prodRes.data)) {
                setProducts(prodRes.data);
            }
        } catch (error) {
            console.error('Error loading POS catalog:', error);
        }
    };

    // Calculate Tax & Grand Totals
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const gstAmount = Number(((subtotal * gstRate) / 100).toFixed(2));
    const grossTotal = subtotal + gstAmount;
    const grandTotal = Math.max(0, Number((grossTotal - Number(discountAmount || 0)).toFixed(2)));
    
    // Effective amount paid
    const actualPaid = amountPaid === '' ? grandTotal : Number(amountPaid);
    const balanceDue = Math.max(0, Number((grandTotal - actualPaid).toFixed(2)));

    // Product search suggestions
    const filteredSuggestions = searchTerm.trim() === '' ? [] : products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const addItem = (product) => {
        const existingIndex = items.findIndex(item => item.productId === product.id);
        if (existingIndex > -1) {
            const updated = [...items];
            updated[existingIndex].quantity += 1;
            setItems(updated);
        } else {
            setItems([...items, {
                productId: product.id,
                productName: product.name,
                category: product.category || 'General',
                quantity: 1,
                unitPrice: Number(product.price) || 0,
                serialNumber: ''
            }]);
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const updateQuantity = (index, delta) => {
        const updated = [...items];
        const newQty = updated[index].quantity + delta;
        if (newQty > 0) {
            updated[index].quantity = newQty;
            setItems(updated);
        }
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!customerName.trim()) {
            alert('⚠️ Please enter customer name');
            return;
        }

        if (items.length === 0) {
            alert('⚠️ Please add at least 1 product to the bill');
            return;
        }

        setLoading(true);

        const payload = {
            customerName: customerName.trim(),
            customerContact: customerContact.trim() || 'N/A',
            deliveryAddress: deliveryAddress.trim() || 'N/A',
            gstRate: Number(gstRate),
            discountAmount: Number(discountAmount || 0),
            paymentMethod,
            amountPaid: actualPaid,
            notes: notes.trim(),
            items: items.map(item => ({
                product: { id: item.productId },
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                serialNumber: item.serialNumber || ''
            }))
        };

        try {
            const res = await createInvoice(payload);
            if (res.data && res.data.id) {
                navigate(`/invoice/${res.data.id}`);
            } else {
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('❌ Failed to generate bill. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            {/* Header / Action Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                        🧾 Counter Billing (POS)
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500' }}>
                        Fast tax invoice generation &amp; receipt checkout
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-cancel"
                        style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        className="btn-primary"
                        style={{
                            padding: '11px 24px',
                            fontSize: '14px',
                            fontWeight: '800'
                        }}
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
                        padding: '22px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <div style={{ marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                👤 Customer Information
                            </h3>
                        </div>

                        <div className="customer-info-grid">
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Customer Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="e.g. Ramesh Parab"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        fontSize: '14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Phone Number (WhatsApp)
                                </label>
                                <input
                                    type="tel"
                                    value={customerContact}
                                    onChange={(e) => setCustomerContact(e.target.value)}
                                    placeholder="e.g. 9822123456"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        fontSize: '14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Delivery / Village Address
                                </label>
                                <input
                                    type="text"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="e.g. Near Central Plaza, Panaji"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                    Bill Remarks / Warranty Notes
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. 1 Yr Manufacturer Warranty"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Product Search & Add */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '22px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative'
                    }} ref={dropdownRef}>
                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                            🔍 Search &amp; Add Items to Bill
                        </h3>

                        <input
                            type="text"
                            placeholder="Type product name, model (e.g. Samsung 43 TV, Haier Fridge)..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '14px',
                                borderRadius: '10px',
                                border: '2px solid var(--gold)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />

                        {/* Search Dropdown Results */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '85px',
                                left: '22px',
                                right: '22px',
                                background: 'var(--bg-card)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-xl)',
                                zIndex: 100,
                                maxHeight: '240px',
                                overflowY: 'auto'
                            }}>
                                {filteredSuggestions.map((prod) => (
                                    <div
                                        key={prod.id}
                                        onClick={() => addItem(prod)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-primary)' }}>
                                                {prod.name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {prod.category} • {prod.quantity} in stock
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '900', color: 'var(--gold)', fontSize: '14px' }}>
                                            ₹{Number(prod.price).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Selected Items Table */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                🛒 Selected Bill Items ({items.length})
                            </h3>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setItems([])}
                                    style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>Your bill cart is empty</div>
                                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Search products above to add items to this invoice.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product Details</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>Qty</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Unit Price (₹)</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Total (₹)</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                                                        {item.productName}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="S/N or Model Serial (optional)"
                                                        value={item.serialNumber}
                                                        onChange={(e) => {
                                                            const updated = [...items];
                                                            updated[index].serialNumber = e.target.value;
                                                            setItems(updated);
                                                        }}
                                                        style={{
                                                            marginTop: '4px',
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            borderRadius: '5px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-body)',
                                                            color: 'var(--text-primary)',
                                                            width: '100%',
                                                            maxWidth: '240px'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(index, -1)}
                                                            style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            -
                                                        </button>
                                                        <span style={{ padding: '4px 10px', fontWeight: '800', fontSize: '13px' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(index, 1)}
                                                            style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700' }}>
                                                    ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: 'var(--text-primary)' }}>
                                                    ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '16px' }}
                                                        title="Remove item"
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

                {/* RIGHT COLUMN: Live Bill Summary & Payment */}
                <div className="pos-summary-card" style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 <span>Bill Summary</span>
                    </h3>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Taxable Subtotal:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                            <span>GST Slabs:</span>
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
                                    fontWeight: '700'
                                }}
                            >
                                <option value={0}>0% (Exempted)</option>
                                <option value={5}>5% (Basic)</option>
                                <option value={12}>12% (Standard)</option>
                                <option value={18}>18% (Electronics)</option>
                                <option value={28}>28% (Luxury)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>GST Amount ({gstRate}%):</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                            <span>Discount (₹):</span>
                            <input
                                type="number"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                min="0"
                                style={{
                                    width: '100px',
                                    padding: '4px 8px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    fontWeight: '700'
                                }}
                            />
                        </div>
                    </div>

                    {/* GRAND TOTAL HIGHLIGHT */}
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '2px dashed var(--gold)',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Grand Payable Total
                        </div>
                        <div style={{ fontSize: '34px', fontWeight: '900', color: 'var(--gold)', letterSpacing: '-0.5px', marginTop: '2px' }}>
                            ₹{grandTotal.toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Payment Method
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {['CASH', 'UPI', 'CARD'].map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setPaymentMethod(mode)}
                                    style={{
                                        padding: '9px 0',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        borderRadius: '8px',
                                        border: paymentMethod === mode ? '2px solid var(--gold)' : '1px solid var(--border-color)',
                                        background: paymentMethod === mode ? 'var(--gold-light)' : 'var(--bg-body)',
                                        color: paymentMethod === mode ? '#92400e' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {mode === 'CASH' ? '💵 Cash' : mode === 'UPI' ? '📱 UPI' : '💳 Card'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Payment Presets */}
                    <div style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                Amount Received (₹)
                            </label>
                            <span style={{ fontSize: '11px', color: balanceDue > 0 ? '#f59e0b' : '#10b981', fontWeight: '800' }}>
                                {balanceDue > 0 ? `🟡 Due: ₹${balanceDue.toLocaleString('en-IN')}` : '✅ Full Paid'}
                            </span>
                        </div>
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder={`₹${grandTotal} (Full Amount)`}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '16px',
                                fontWeight: '800',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                marginBottom: '8px'
                            }}
                        />

                        {/* Preset Chips */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setAmountPaid(grandTotal)}
                                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', cursor: 'pointer' }}
                            >
                                ⚡ Full Paid
                            </button>
                            <button
                                type="button"
                                onClick={() => setAmountPaid('0')}
                                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', cursor: 'pointer' }}
                            >
                                🟡 100% Due
                            </button>
                        </div>
                    </div>

                    {/* Checkout Action Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: '800',
                            borderRadius: '10px'
                        }}
                    >
                        {loading ? 'Generating Bill...' : '🖨️ Create & Print Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateInvoice;
