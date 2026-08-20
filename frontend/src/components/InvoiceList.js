import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice } from '../services/api';

function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleDelete = async (id) => {
        if (window.confirm('Delete this invoice?')) {
            try {
                await deleteInvoice(id);
                loadInvoices();
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
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
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        minWidth: '200px'
                    }}
                />
                <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>
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
                        <tr className="table-empty-row">
                            <td colSpan="6">
                                📋 No invoices found. Create a new invoice to get started.
                            </td>
                        </tr>
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
                                        className="btn-secondary"
                                        style={{ marginRight: '5px', padding: '6px 12px' }}
                                    >
                                        👁️ View
                                    </button>
                                    <button
                                        onClick={() => handleDelete(inv.id)}
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
        </div>
    );
}

export default InvoiceList;