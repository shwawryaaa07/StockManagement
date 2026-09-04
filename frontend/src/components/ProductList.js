import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, deleteProduct } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from './SkeletonLoader';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import DeleteModal from './DeleteModal';
import Icon from './Icon';
import { formatCurrency } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

export function ProductList() {
  usePageTitle('Products & Inventory');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const toast = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.modelNumber || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Export to CSV
  const exportToCsv = () => {
    if (filteredProducts.length === 0) {
      toast.warning('No products to export.');
      return;
    }

    const headers = ['Product ID', 'Name', 'Model Number', 'Category', 'Stock Quantity', 'Low Stock Alert Threshold', 'Unit Price (₹)', 'Stock Value (₹)'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.modelNumber || ''}"`,
      `"${p.category || 'General'}"`,
      p.quantity || 0,
      p.lowStockThreshold || 2,
      p.price || 0,
      ((p.quantity || 0) * (p.price || 0))
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory catalog exported to CSV!');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <TableSkeleton rows={7} cols={6} />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header & Overview Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="products" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              Inventory &amp; Products
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0 0' }}>
              Manage items, pricing, alert thresholds, and live warehouse stocks
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportToCsv}
            className="btn-cancel"
            style={{ padding: '9px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
          >
            <Icon name="csv" size={15} /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <Icon name="plus" size={16} /> Add Product
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
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Unique Products</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
            {products.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Units In Stock</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary-color, #3b82f6)', marginTop: '4px' }}>
            {totalInventoryCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Inventory Asset Value</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
            {formatCurrency(totalInventoryValue)}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, model number, brand..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: selectedCategory === cat ? 'var(--gold)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>PRODUCT NAME &amp; MODEL</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>CATEGORY</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>STOCK QTY</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>UNIT PRICE (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>STATUS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const threshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 2;
                  const isLow = (p.quantity || 0) <= threshold;
                  const isOut = (p.quantity || 0) <= 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{p.name}</div>
                        {p.modelNumber && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Model: {p.modelNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {p.category || 'General'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                          {p.quantity || 0}
                        </span>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Alert @ &le;{threshold}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--gold)' }}>
                        {formatCurrency(p.price)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span className={`badge ${isOut ? 'badge--danger' : isLow ? 'badge--warning' : 'badge--success'}`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="btn-cancel"
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Icon name="edit" size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="btn-cancel"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', color: '#ef4444' }}
                            title="Delete Product"
                          >
                            <Icon name="trash" size={14} />
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

      {showAddModal && (
        <AddProduct
          onClose={() => setShowAddModal(false)}
          onProductAdded={() => {
            setShowAddModal(false);
            loadProducts();
          }}
        />
      )}

      {editingProduct && (
        <EditProduct
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={() => {
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Product"
          message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}

export default ProductList;
