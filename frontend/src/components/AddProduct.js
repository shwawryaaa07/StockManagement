import React, { useState } from 'react';
import { createProduct } from '../services/api';
import { useToast } from '../context/ToastContext';

function AddProduct({ onRefresh, isOpen, onClose }) {
    const [name, setName] = useState('');
    const [modelNumber, setModelNumber] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('2');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [serialNumbers, setSerialNumbers] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    if (!isOpen) return null;

    const commonCategories = ['TV', 'AC', 'Washing Machine', 'Refrigerator', 'Microwave', 'Mobile', 'Audio', 'Home Appliance', 'Other'];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !price || !quantity) {
            toast.warning('Please fill in product name, price, and stock quantity.');
            return;
        }

        const finalCategory = category === 'Other' ? (customCategory.trim() || 'General') : (category || 'General');

        setLoading(true);

        const productData = {
            name: name.trim(),
            modelNumber: modelNumber.trim(),
            price: parseFloat(price),
            quantity: parseInt(quantity, 10),
            lowStockThreshold: parseInt(lowStockThreshold, 10) || 2,
            category: finalCategory,
            serialNumbers: serialNumbers.trim()
        };

        try {
            await createProduct(productData);
            toast.success(`Product "${productData.name}" added to inventory!`);
            setName('');
            setModelNumber('');
            setPrice('');
            setQuantity('');
            setLowStockThreshold('2');
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
            const err = apiMessage || fallbackMessage;
            toast.error('Failed to add product: ' + err);
        } finally {
            setLoading(false);
        }
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
                        <span>📦</span> <span>Add New Product to Inventory</span>
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>

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
                                placeholder="Enter product name"
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
                                placeholder="Enter model number (optional)"
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
                                inputMode="decimal"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Enter unit price"
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
                                inputMode="numeric"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Enter stock quantity"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
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

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Low Stock Alert Level
                            </label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                placeholder="e.g. 2"
                                min="0"
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

                    {category === 'Other' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                Specify Custom Category
                            </label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter category name"
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
                            placeholder="Enter serial numbers separated by commas (optional)"
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
