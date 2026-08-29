import React, { useState } from 'react';
import { createProduct } from '../services/api';

function AddProduct({ onRefresh, isOpen, onClose }) {
    const [name, setName] = useState('');
    const [modelNumber, setModelNumber] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [serialNumbers, setSerialNumbers] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const commonCategories = ['TV', 'AC', 'Washing Machine', 'Refrigerator', 'Microwave', 'Mobile', 'Audio', 'Home Appliance', 'Other'];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !price || !quantity) {
            setMessage('⚠️ Please fill in product name, price, and stock quantity.');
            return;
        }

        const finalCategory = category === 'Other' ? (customCategory.trim() || 'General') : (category || 'General');

        setLoading(true);
        setMessage('');

        const productData = {
            name: name.trim(),
            modelNumber: modelNumber.trim(),
            price: parseFloat(price),
            quantity: parseInt(quantity, 10),
            category: finalCategory,
            serialNumbers: serialNumbers.trim()
        };

        try {
            await createProduct(productData);
            setName('');
            setModelNumber('');
            setPrice('');
            setQuantity('');
            setCategory('');
            setCustomCategory('');
            setSerialNumbers('');
            if (typeof onRefresh === 'function') {
                onRefresh();
            }
            onClose();
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            setMessage('❌ Error adding product: ' + (apiMessage || fallbackMessage));
        }

        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '540px',
                padding: '24px',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📦 <span>Add New Product to Inventory</span>
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>

                {message && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: message.startsWith('✅') ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                        color: message.startsWith('✅') ? '#2e7d32' : '#c62828',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '16px'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Product Name / Brand *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. AMSTRAD 1.5 Ton AC"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Model Number
                            </label>
                            <input
                                type="text"
                                value={modelNumber}
                                onChange={(e) => setModelNumber(e.target.value)}
                                placeholder="e.g. Ams:1833"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Unit Price (₹) *
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Stock Quantity *
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="e.g. 5"
                                min="0"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="">Select Category...</option>
                            {commonCategories.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {category === 'Other' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Specify Custom Category
                            </label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter custom category name"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                Serial Numbers in Stock (Optional)
                            </label>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Comma-separated</span>
                        </div>
                        <input
                            type="text"
                            value={serialNumbers}
                            onChange={(e) => setSerialNumbers(e.target.value)}
                            placeholder="e.g. QA507B26NLZ, TK02235, SN88910"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            💡 You can also type or scan any serial number directly when making an invoice.
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancel"
                            style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: '700' }}
                        >
                            {loading ? 'Saving...' : '💾 Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProduct;
