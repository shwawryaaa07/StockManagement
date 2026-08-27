// @ts-nocheck
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
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            setMessage('❌ Error adding product: ' + (apiMessage || fallbackMessage));
            setTimeout(() => setMessage(''), 3000);
        }

        setLoading(false);
    };

    const styles = {
        container: { marginBottom: '20px' },
        showBtn: {
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
        },
        formContainer: {
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)'
        },
        title: { margin: '0 0 15px 0', color: 'var(--text-primary)' },
        message: {
            padding: '10px 15px',
            borderRadius: '8px',
            marginBottom: '15px'
        },
        form: { display: 'flex', flexDirection: 'column', gap: '10px' },
        row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
        field: { flex: 1, minWidth: '200px' },
        label: {
            display: 'block',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '5px',
            color: 'var(--text-secondary)'
        },
        input: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        select: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        buttonRow: { display: 'flex', gap: '10px', marginTop: '10px' },
        submitBtn: {
            backgroundColor: 'var(--primary)',
            color: 'var(--btn-primary-text, #ffffff)',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
        },
        // ✅ FIX: Cancel button is now RED
        cancelBtn: {
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
        }
    };

    return (
        <div style={styles.container}>
            {!showForm ? (
                <button onClick={() => setShowForm(true)} style={styles.showBtn}>
                    ➕ Add New Product
                </button>
            ) : (
                <div style={styles.formContainer}>
                    <h3 style={styles.title}>➕ Add New Product</h3>

                    {message && (
                        <div style={{
                            ...styles.message,
                            backgroundColor: message.includes('✅') ? 'var(--success-bg, #e8f5e9)' : 'var(--danger-bg, #ffebee)',
                            color: message.includes('✅') ? 'var(--success-text, #2e7d32)' : 'var(--danger-text, #c62828)'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.row}>
                            <div style={styles.field}>
                                <label style={styles.label}>Product Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={styles.input}
                                    placeholder="Samsung 55-inch TV"
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Price (₹) *</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={styles.input}
                                    placeholder="55000"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.field}>
                                <label style={styles.label}>Quantity *</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    style={styles.input}
                                    placeholder="5"
                                    min="0"
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={styles.select}
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

                        <div style={styles.buttonRow}>
                            <button type="submit" style={styles.submitBtn} disabled={loading}>
                                {loading ? 'Adding...' : '💾 Save Product'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
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