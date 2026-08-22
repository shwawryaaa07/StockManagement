import React, { useState, useEffect } from 'react';
import { getProducts, createInvoice } from '../services/api';

function CreateInvoice() {
    const [products, setProducts] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [gstRate, setGstRate] = useState(18);
    const [items, setItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProducts().catch(console.error);
    }, []);

    const loadProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const addItem = () => {
        if (!selectedProduct || quantity < 1) {
            alert('Please select a product and enter quantity');
            return;
        }
        const product = products.find(p => p.id === Number(selectedProduct));
        if (!product) return;
        const existing = items.find(i => i.product.id === product.id);
        if (existing) {
            alert('Product already added!');
            return;
        }
        if (product.quantity < quantity) {
            alert(`Only ${product.quantity} items in stock!`);
            return;
        }
        setItems([...items, {
            product: { id: product.id },
            quantity: Number(quantity),
            unitPrice: product.price
        }]);
        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    const gstAmount = subtotal * (gstRate / 100);
    const totalAmount = subtotal + gstAmount;

    // ✅ NEW: Business info removed from frontend
    // The backend will set these values from server config
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Please add at least one product!');
            return;
        }
        if (!customerName.trim()) {
            alert('Please enter customer name!');
            return;
        }
        setLoading(true);

        const invoiceData = {
            customerName,
            customerContact: customerContact || 'N/A',
            deliveryAddress: deliveryAddress || 'N/A',
            gstRate,
            paymentMode,
            amountPaid: parseFloat(amountPaid) || 0,
            items
        };

        try {
            const response = await createInvoice(invoiceData);
            alert(`✅ Invoice ${response.data.invoiceNumber} created successfully!`);
            setCustomerName('');
            setCustomerContact('');
            setDeliveryAddress('');
            setAmountPaid('');
            setItems([]);
            setGstRate(18);
        } catch (error) {
            alert('❌ Error creating invoice: ' + (error.response?.data?.message || error.message));
        }
        setLoading(false);
    };

    // ============================================================
    // STYLES WITH THEME VARIABLES
    // ============================================================

    const styles = {
        container: { padding: '30px', maxWidth: '900px', margin: '0 auto' },
        title: { marginBottom: '20px', color: 'var(--text-primary)' },
        form: {
            backgroundColor: 'var(--bg-card)',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)'
        },
        section: { marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid var(--border-color)' },
        sectionTitle: { margin: '0 0 15px 0', fontSize: '18px', color: 'var(--primary)' },
        row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
        field: { flex: 1, minWidth: '200px', marginBottom: '10px' },
        label: { display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: 'var(--text-secondary)' },
        input: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        addBtn: {
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            height: '40px'
        },
        tableWrapper: { overflowX: 'auto' },
        table: { width: '100%', borderCollapse: 'collapse' },
        tableHead: { backgroundColor: '#1a237e', color: 'white' },
        tableRow: { borderBottom: '1px solid var(--border-color)' },
        tableCell: { padding: '10px', textAlign: 'left', color: 'var(--text-primary)' },
        removeBtn: {
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            cursor: 'pointer'
        },
        totals: {
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '2px solid var(--border-color)',
            textAlign: 'right',
            color: 'var(--text-primary)'
        },
        totalRow: { display: 'flex', justifyContent: 'flex-end', gap: '20px', padding: '5px 0' },
        submitBtn: {
            width: '100%',
            padding: '14px',
            backgroundColor: '#1a237e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        select: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🧾 Create Invoice</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Customer Details */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Customer Details</h3>
                    <div style={styles.row}>
                        <div style={styles.field}>
                            <label style={styles.label}>Customer Name *</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required style={styles.input} placeholder="Enter customer name" />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Contact</label>
                            <input type="text" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} style={styles.input} placeholder="Phone number" />
                        </div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Delivery Address</label>
                        <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} style={styles.input} placeholder="Delivery address" />
                    </div>
                </div>

                {/* GST & Payment */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>GST & Payment</h3>
                    <div style={styles.row}>
                        <div style={styles.field}>
                            <label style={styles.label}>GST Rate</label>
                            <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))} style={styles.select}>
                                <option value="0">0% (No GST)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18% (Default)</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={styles.select}>
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="CARD">💳 Card</option>
                            </select>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Amount Paid</label>
                            <input
                                type="number"
                                value={amountPaid === '0' ? '' : amountPaid}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setAmountPaid(val);
                                    }
                                }}
                                style={styles.input}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onFocus={(e) => {
                                    if (e.target.value === '0') {
                                        setAmountPaid('');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Add Products */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Add Products</h3>
                    <div style={styles.row}>
                        <div style={{ flex: 2 }}>
                            <label style={styles.label}>Product</label>
                            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={styles.select}>
                                <option value="">Select a product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (₹{p.price}) - Stock: {p.quantity}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Quantity</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" style={styles.input} />
                        </div>
                        <div style={{ flex: 0.5, display: 'flex', alignItems: 'flex-end' }}>
                            <button type="button" onClick={addItem} style={styles.addBtn}>➕ Add</button>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Items ({items.length})</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                <tr style={styles.tableHead}>
                                    <th style={styles.tableCell}>Product</th>
                                    <th style={styles.tableCell}>Qty</th>
                                    <th style={styles.tableCell}>Price</th>
                                    <th style={styles.tableCell}>Total</th>
                                    <th style={styles.tableCell}>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map((item, index) => {
                                    const product = products.find(p => p.id === item.product.id);
                                    return (
                                        <tr key={index} style={styles.tableRow}>
                                            <td style={styles.tableCell}>{product?.name || 'Unknown'}</td>
                                            <td style={styles.tableCell}>{item.quantity}</td>
                                            <td style={styles.tableCell}>₹{item.unitPrice}</td>
                                            <td style={styles.tableCell}>₹{item.quantity * item.unitPrice}</td>
                                            <td style={styles.tableCell}>
                                                <button type="button" onClick={() => removeItem(index)} style={styles.removeBtn}>✕</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                        <div style={styles.totals}>
                            <div style={styles.totalRow}><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
                            <div style={styles.totalRow}><span>GST ({gstRate}%):</span><span>₹{gstAmount.toLocaleString()}</span></div>
                            <div style={styles.totalRow}><span><strong>Total:</strong></span><span><strong>₹{totalAmount.toLocaleString()}</strong></span></div>
                        </div>
                    </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '18px', marginTop: '10px' }} disabled={loading}>
                    {loading ? 'Creating...' : '✨ Generate Invoice'}
                </button>
            </form>
        </div>
    );
}

export default CreateInvoice;