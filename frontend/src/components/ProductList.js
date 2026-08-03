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
        loadProducts().catch(console.error);  // ✅ Fixed: Promise handled
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
            await deleteProduct(selectedProduct.id);
            setShowDeleteModal(false);
            setSelectedProduct(null);
            await loadProducts();  // ✅ Fixed: await added
        }
    };

    if (loading) return <h2 style={{ padding: '30px' }}>Loading...</h2>;

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📦 Products</h2>
                <AddProduct />
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                    <tr style={styles.tableHead}>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Quantity</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No products found</td></tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id} style={styles.tableRow}>
                                <td style={styles.td}>{product.id}</td>
                                <td style={styles.td}>{product.name}</td>
                                <td style={styles.td}>₹{product.price.toLocaleString()}</td>
                                <td style={styles.td}>{product.quantity}</td>
                                <td style={styles.td}>{product.category}</td>
                                <td style={styles.td}>
                                    <button onClick={() => setEditingProduct(product)} style={styles.editBtn}>✏️ Edit</button>
                                    <button onClick={() => handleDeleteClick(product)} style={styles.deleteBtn}>🗑️ Delete</button>
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

const styles = {cls
