import React, { useState, useEffect } from 'react';
import { getProducts, deleteProduct } from '../services/api';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import DeleteModal from './DeleteModal';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        loadProducts().catch(console.error);
    }, []);

    const loadProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading products:', error);
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
                setSelectedProduct(null);
                await loadProducts();
            } catch (error) {
                alert('❌ Error deleting product: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    if (loading) return <h2 style={{ padding: '30px', color: 'var(--text-primary)' }}>Loading...</h2>;

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📦 Products</h2>
                <AddProduct />
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.length === 0 ? (
                        <tr className="table-empty-row">
                            <td colSpan="6">
                                📦 No products found. Click "Add New Product" to get started.
                            </td>
                        </tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>₹{product.price.toLocaleString()}</td>
                                {/* ✅ FIX 3: Low-Stock Indicator */}
                                <td style={{
                                    color: product.quantity <= 2 ? '#ef5350' : 'var(--text-primary)',
                                    fontWeight: product.quantity <= 2 ? 'bold' : 'normal'
                                }}>
                                    {product.quantity}
                                    {product.quantity <= 2 && <span style={{ marginLeft: '8px', fontSize: '12px' }}>⚠️ Low Stock</span>}
                                </td>
                                <td>{product.category}</td>
                                <td>
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="btn-success"
                                        style={{ marginRight: '5px' }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(product)}
                                        className="btn-danger"
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {editingProduct && (
                <EditProduct product={editingProduct} onClose={() => setEditingProduct(null)} onRefresh={loadProducts} />
            )}

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