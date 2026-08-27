import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, getProducts, updateInvoice } from '../services/api';

function EditInvoice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    useEffect(() => {
        loadData().catch(console.error);
    }, []);

    const loadData = async () => {
        try {
            const [invoiceRes, productsRes] = await Promise.all([
                getInvoice(id),
                getProducts()
            ]);
            const invoice = invoiceRes.data;
            setProducts(productsRes.data);
            setCustomerName(invoice.customerName);
            setCustomerContact(invoice.customerContact || '');
            setDeliveryAddress(invoice.deliveryAddress || '');
            setPaymentMode(invoice.paymentMode || 'CASH');
            setAmountPaid(invoice.amountPaid || '');
            setGstRate(invoice.gstRate || 18);
            setItems(invoice.items || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading invoice:', error);
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!selectedProduct || quantity < 1) return;
        const product = products.find(p => p.id === Number(selectedProduct));
        if (!product) return;
        const existing = items.find(i => i.product.id === product.id);
        if (existing) {
            alert('Product already added!');
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

    const handleSave = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Add at least one product!');
            return;
        }
        if (!customerName.trim()) {
            alert('Please enter customer name!');
            return;
        }
        if (customerContact && customerContact.length !== 10) {
            alert('Contact number must be exactly 10 digits!');
            return;
        }
        setSaving(true);
        try {
            await updateInvoice(id, {
                customerName,
                customerContact: customerContact || 'N/A',
                deliveryAddress: deliveryAddress || 'N/A',
                paymentMode,
                amountPaid: parseFloat(amountPaid) || 0,
                gstRate,
                items
            });
            alert('✅ Invoice updated successfully!');
            navigate(`/invoice/${id}`);
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            alert('❌ Error updating invoice: ' + (apiMessage || fallbackMessage));
        }
        setSaving(false);
    };

    const styles = {
        container: { maxWidth: '900px', margin: '0 auto' },
        title: { marginBottom: '20px', color: 'var(--text-primary)' },
        form: {
            background: 'var(--bg-card)',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)'
        },
        section: { marginBottom: '20px' },
        sectionTitle: { marginBottom: '10px', color: 'var(--text-primary)' },
        row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
        field: { flex: 1, minWidth: '200px' },
        label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' },
        input: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        buttonRow: { display: 'flex', gap: '12px', marginTop: '20px' },
        submitBtn: {
            flex: 1,
            padding: '12px',
            background: '#1a237e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        },
        // ✅ FIX: Cancel button is now RED
        cancelBtn: {
            padding: '12px 25px',
            background: '#ef5350',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        },
        addBtn: {
            padding: '8px 18px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
        },
        removeBtn: {
            background: '#ef5350',
            color: 'white',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
        },
        totals: {
            textAlign: 'right',
            borderTop: '2px solid var(--border-color)',
            paddingTop: '15px',
            color: 'var(--text-primary)'
        },
        tableHeader: { background: '#1a237e', color: 'white' },
        tableCell: { padding: '8px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }
    };

    if (loading) return <div style={{ padding: '30px' }}><h2 style={{ color: 'var(--text-primary)' }}>Loading...</h2></div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>✏️ Edit Invoice - {id}</h2>

            <form onSubmit={handleSave} style={styles.form}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Customer Details</h3>
                    <div style={styles.row}>
                        <div style={styles.field}>
                            <label style={styles.label}>Name *</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[a-zA-Z\s.]*$/.test(val) || val === '') {
                                        setCustomerName(val);
                                    }
                                }}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Contact</label>
                            <input
                                type="text"
                                value={customerContact}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val) && val.length <= 10) {
                                        setCustomerContact(val);
                                    }
                                }}
                                style={styles.input}
                                placeholder="10 digit phone number"
                                maxLength={10}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label style={styles.label}>Delivery Address</label>
                        <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>GST & Payment</h3>
                    <div style={styles.row}>
                        <div style={styles.field}>
                            <label style={styles.label}>GST Rate</label>
                            <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))} style={styles.input}>
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={styles.input}>
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="CARD">💳 Card</option>
                            </select>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Amount Paid</label>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                style={styles.input}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Items</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ flex: 2, ...styles.input }}>
                            <option value="">Select product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                        </select>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" style={{ width: '80px', ...styles.input }} />
                        <button type="button" onClick={addItem} style={styles.addBtn}>➕ Add</button>
                    </div>

                    {items.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map((item, i) => {
                                    const p = products.find(p => p.id === item.product.id);
                                    return (
                                        <tr key={i}>
                                            <td style={styles.tableCell}>{p?.name || 'Unknown'}</td>
                                            <td style={styles.tableCell}>{item.quantity}</td>
                                            <td style={styles.tableCell}>₹{item.unitPrice}</td>
                                            <td style={styles.tableCell}>₹{item.quantity * item.unitPrice}</td>
                                            <td style={styles.tableCell}>
                                                <button type="button" onClick={() => removeItem(i)} style={styles.removeBtn}>✕</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={styles.totals}>
                    <p><strong>Subtotal:</strong> ₹{subtotal.toLocaleString()}</p>
                    <p><strong>GST ({gstRate}%):</strong> ₹{gstAmount.toLocaleString()}</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold' }}><strong>Total:</strong> ₹{totalAmount.toLocaleString()}</p>
                </div>

                <div style={styles.buttonRow}>
                    <button type="submit" style={styles.submitBtn} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button type="button" onClick={() => navigate(`/invoice/${id}`)} style={styles.cancelBtn}>
                        ❌ Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditInvoice;