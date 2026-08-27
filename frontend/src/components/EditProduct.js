// @ts-nocheck
import React, { useState } from 'react';
import { updateProduct } from '../services/api';

/**
 * @typedef {Object} Product
 * @property {string|number} id
 * @property {string} [name]
 * @property {number|string} [price]
 * @property {number|string} [quantity]
 * @property {string} [category]
 */

/**
 * @param {{ product: Product, onClose: Function, onRefresh: Function }} props
 */
function EditProduct({ product, onClose, onRefresh }) {
    // Wrapping in String() guarantees the IDE correctly infers these as strings,
    // preventing the "Type unknown is not assignable..." errors on your input values.
    const [name, setName] = useState(product?.name !== undefined ? String(product.name) : '');
    const [price, setPrice] = useState(product?.price !== undefined ? String(product.price) : '0');
    const [quantity, setQuantity] = useState(product?.quantity !== undefined ? String(product.quantity) : '0');
    const [category, setCategory] = useState(product?.category !== undefined ? String(product.category) : '');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: 'var(--bg-card)',
            padding: '25px',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
        },
        title: {
            margin: 0,
            color: 'var(--text-primary)'
        },
        closeBtn: {
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            color: 'var(--text-muted)'
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
            marginBottom: '5px',
            color: 'var(--text-secondary)'
        },
        input: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        select: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
        },
        buttonRow: {
            display: 'flex',
            gap: '10px',
            marginTop: '10px'
        },
        submitBtn: {
            backgroundColor: 'var(--primary)',
            color: 'var(--btn-primary-text, #ffffff)',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer'
        },
        cancelBtn: {
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer'
        }
    };

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
            // Wrapping in String() fixes the "Argument type unknown..." warnings
            price: parseFloat(String(price)),
            quantity: parseInt(String(quantity), 10),
            category: category || 'General'
        };

        try {
            await updateProduct(product.id, productData);
            setMessage('✅ Product updated successfully!');
            setTimeout(() => {
                onRefresh();
                onClose();
            }, 1000);
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            setMessage('❌ Error updating product: ' + (apiMessage || fallbackMessage));
            setTimeout(() => setMessage(''), 3000);
        }

        setLoading(false);
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>✏️ Edit Product</h3>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

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
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : '💾 Update Product'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.cancelBtn}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProduct;