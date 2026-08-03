import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, getProducts } from '../services/api';

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
        loadData();
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
        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return;
        const existing = items.find(i => i.product.id === product.id);
        if (existing) {
            alert('Product already added!');
            return;
        }
        setItems([...items, {
            product: { id: product.id },
            quantity: parseInt(quantity),
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
        setSaving(true);
        try {
            alert('✅ Invoice updated successfully! (Feature coming soon)');
            navigate(`/invoice/${id}`);
        } catch (error) {
            alert('❌ Error updating invoice');
        }
        setSaving(false);
    };

    if (loading) return <div className="dashboard"><h2>Loading...</h2></div>;

    return (
        <div className="dashboard" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>✏️ Edit Invoice - {id}</h2>

            <form onSubmit={handleSave} style={{
                background: 'var(--bg-card, white)',
                padding: '25px',
                borderRadius: '12px',
                border: '1px solid var(--border, #ddd)',
                boxShadow: 'var(--shadow, 0 2px 10px rgba(0,0,0,0.08))'
            }}>
                {/* Customer Details */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Customer Details</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name *</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                   style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} required />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Contact</label>
                            <input type="text" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)}
                                   style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Delivery Address</label>
                        <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                               style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                    </div>
                </div>

                {/* GST & Payment */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>GST & Payment</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>GST Rate</label>
                            <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="CARD">💳 Card</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Amount Paid</label>
                            <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                                   style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} placeholder="0" />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Items</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                                style={{ flex: 2, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <option value="">Select product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                        </select>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1"
                               style={{ width: '80px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        <button type="button" onClick={addItem}
                                style={{ padding: '8px 18px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            ➕ Add
                        </button>
                    </div>

                    {items.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ background: '#1a237e', color: 'white' }}>
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
                                        <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '8px 12px' }}>{p?.name || 'Unknown'}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{item.unitPrice}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{item.quantity * item.unitPrice}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                <button type="button" onClick={() => removeItem(i)}
                                                        style={{ background: '#ef5350', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div style={{ textAlign: 'right', borderTop: '2px solid #ddd', paddingTop: '15px' }}>
                    <p><strong>Subtotal:</strong> ₹{subtotal.toLocaleString()}</p>
                    <p><strong>GST ({gstRate}%):</strong> ₹{gstAmount.toLocaleString()}</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold' }}><strong>Total:</strong> ₹{totalAmount.toLocaleString()}</p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" style={{
                        flex: 1,
                        padding: '12px',
                        background: '#1a237e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button type="button" onClick={() => navigate(`/invoice/${id}`)} style={{
                        padding: '12px 25px',
                        background: '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        ❌ Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditInvoice;