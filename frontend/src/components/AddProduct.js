import React, { useState } from 'react';
import { createProduct } from '../services/api';

function AddProduct() {
    // ============================================================
    // STATE
    // ============================================================
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);

    // ============================================================
    // SUBMIT - Add Product
    // ============================================================
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

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div style={styles.container}>
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    style={styles.showBtn}
                >
                    ➕ Add New Product
                </button>
            ) : (
                <div style={styles.formContainer}>
                    <h3 style={styles.title}>➕ Add New Product</h3>

                    {message && (
                        <div style={{
                            ...styles.message,
                            backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                            color: message.includes('✅') ? '#2e7d32' : '#c62828'
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
                                    style={styles.input}
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
                            <button
                                type="submit"
                                style={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : '💾 Save Product'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
    container: {
        marginBottom: '20px'
    },
    showBtn: {
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        padding: '12px 25px',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer'
    },
    formContainer: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    title: {
        margin: '0 0 15px 0'
    },
    message: {
        padding: '10px 15px',
        borderRadius: '5px',
        marginBottom: '15px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    row: {
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap'
    },
    field: {
        flex: 1,
        minWidth: '200px'
    },
    label: {
        display: 'block',
        fontWeight: 'bold',
        fontSize: '14px',
        marginBottom: '5px'
    },
    input: {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box'
    },
    buttonRow: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    submitBtn: {
        backgroundColor: '#1a237e',
        color: 'white',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '5px',
        fontSize: '14px',
        cursor: 'pointer'
    },
    cancelBtn: {
        backgroundColor: '#999',
        color: 'white',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '5px',
        fontSize: '14px',
        cursor: 'pointer'
    }
};

export default AddProduct;