import React, { useState } from 'react';
import { createProduct } from '../services/api';

function AddProduct() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !price || !quantity) {
            setMessage('⚠️ Please fill all required fields');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setLoading(true);

        const productData = {
            name: name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            category: category || 'General'
        };

        try {
            await createProduct(productData);
            setMessage(`✅ Product "${name}" added successfully!`);
            setName('');
            setPrice('');
            setQuantity('');
            setCategory('');
            setShowForm(false);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('❌ Error adding product: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setMessage(''), 3000);
        }

        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            {!showForm ? (
                <button onClick={() => setShowForm(true)} className="btn-success" style={{ fontSize: '14px' }}>
                    ➕ Add New Product
                </button>
            ) : (
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow)'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>➕ Add New Product</h3>

                    {message && (
                        <div style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                            color: message.includes('✅') ? '#2e7d32' : '#c62828'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' }}>Product Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Samsung 55-inch TV"
                                    required
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' }}>Price (₹) *</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="55000"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' }}>Quantity *</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="5"
                                    min="0"
                                    required
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' }}>Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    <option value="TV">📺 TV</option>
                                    <option value="AC">❄️ AC</option>
                                    <option value="Washing Machine">🧺 Washing Machine</option>
                                    <option value="Microwave">🔥 Microwave</option>
                                    <option value="Refrigerator">🧊 Refrigerator</option>
                                    <option value="Mobile">📱 Mobile</option>
                                    <option value="Laptop">💻 Laptop</option>
                                    <option value="Other">📦 Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Adding...' : '💾 Save Product'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default AddProduct;