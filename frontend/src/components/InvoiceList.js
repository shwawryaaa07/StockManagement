import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice } from '../services/api';
import DeleteModal from './DeleteModal';  // ← ADD THIS

function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const response = await getInvoices();
            setInvoices(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading invoices:', error);
            setLoading(false);
        }
    };

    const handleDeleteClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedInvoice) {
            await deleteInvoice(selectedInvoice.id);
            setShowDeleteModal(false);
            setSelectedInvoice(null);
            loadInvoices();
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="dashboard"><h2>Loading...</h2></div>;

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px' }}>📋 All Invoices</h2>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        border: '1px solid var(--border, #ddd)',
                        borderRadius: '8px',
                        background: 'var(--bg-card, white)',
                        color: 'var(--text-primary, #1a1a2e)',
                        minWidth: '200px'
                    }}
                />
                <span style={{ alignSelf: 'center', color: 'var(--text-muted, #6b6b8a)' }}>
                    {filteredInvoices.length} invoices found
                </span>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredInvoices.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No invoices found</td></tr>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <tr key={inv.id}>
                                <td><strong>{inv.invoiceNumber}</strong></td>
                                <td>{inv.customerName}</td>
                                <td>{inv.createdAt?.split('T')[0] || 'N/A'}</td>
                                <td>₹{inv.totalAmount?.toLocaleString() || 0}</td>
                                <td>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            color: 'white',
                                            backgroundColor: inv.paymentStatus === 'FULLY_PAID' ? '#4caf50' : '#ff9800'
                                        }}>
                                            {inv.paymentStatus === 'FULLY_PAID' ? '✅' : '🟡'} {inv.paymentStatus}
                                        </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                        style={{
                                            backgroundColor: '#1a237e',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginRight: '5px',
                                            fontSize: '13px'
                                        }}
                                    >
                                        👁️ View
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(inv)}
                                        style={{
                                            backgroundColor: '#ef5350',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
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

            {/* DELETE MODAL */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                invoiceNumber={selectedInvoice?.invoiceNumber}
            />
        </div>
    );
}

export default InvoiceList;