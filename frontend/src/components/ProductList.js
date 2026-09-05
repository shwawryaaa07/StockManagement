import React, { useState, useEffect } from 'react';
import { getProducts, deleteProduct } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from './SkeletonLoader';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import DeleteModal from './DeleteModal';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const toast = useToast();

    useEffect(() => {
        loadProducts().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load product catalog.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedProduct) {
            try {
                await deleteProduct(selectedProduct.id);
                setShowDeleteModal(false);
                toast.success(`Product "${selectedProduct.name}" deleted.`);
                setSelectedProduct(null);
                await loadProducts();
            } catch (error) {
                const apiErr = typeof error.response?.data === 'string'
                    ? error.response.data
                    : (error.response?.data?.message || error.message);
                toast.error('Error deleting product: ' + apiErr);
            }
        }
    };

    // Calculate categories and metrics
    const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean)))];
    const totalInventoryCount = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'ALL' || (p.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div className="page-container" style={{ maxWidth: '1350px', margin: '0 auto' }}>
                <TableSkeleton rows={7} cols={6} />
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '1350px', margin: '0 auto' }}>
            {/* Header & Overview Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📦 <span>Inventory &amp; Products</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Manage items, pricing, and live warehouse stocks
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ➕ Add New Product
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
            }}>
                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Unique Products</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {products.length}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Units In Stock</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                        {totalInventoryCount}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Inventory Asset Value</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#2e7d32', marginTop: '4px' }}>
                        ₹{totalInventoryValue.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Search & Category Filter Controls */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                {/* Search Box */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search product name, model, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '11px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-body)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: '600' }}>
                        {filteredProducts.length} item(s) match
                    </span>
                </div>

                {/* Category Chips */}
                {categories.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {categories.map((cat, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                    background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-body)',
                                    color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#ffffff' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '50px' }}>ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Product Name</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unit Price (₹)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '160px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        📦 No products found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const qty = product.quantity || 0;
                                    let stockBadgeBg = 'rgba(76, 175, 80, 0.15)';
                                    let stockBadgeColor = '#2e7d32';
                                    let stockBadgeText = `${qty} in stock`;

                                    if (qty === 0) {
                                        stockBadgeBg = 'rgba(239, 83, 80, 0.15)';
                                        stockBadgeColor = '#c62828';
                                        stockBadgeText = 'Out of stock';
                                    } else if (qty <= 3) {
                                        stockBadgeBg = 'rgba(255, 152, 0, 0.15)';
                                        stockBadgeColor = '#e65100';
                                        stockBadgeText = `Low: ${qty} left`;
                                    }

                                    return (
                                        <tr
                                            key={product.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 35, 126, 0.03)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                {product.id}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                    {product.name}
                                                </div>
                                                {product.modelNumber && (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        Model: <strong>{product.modelNumber}</strong>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: 'var(--bg-body)',
                                                    border: '1px solid var(--border-color)',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {product.category || 'General'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>
                                                ₹{Number(product.price || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    background: stockBadgeBg,
                                                    color: stockBadgeColor
                                                }}>
                                                    {stockBadgeText}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        onClick={() => setEditingProduct(product)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-body)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Edit Product"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(product)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#ffebee',
                                                            color: '#c62828',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Delete Product"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            <AddProduct
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onRefresh={loadProducts}
            />

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProduct
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onRefresh={loadProducts}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                invoiceNumber={selectedProduct?.name}
            />
        </div>
    );
}

export default ProductList;
