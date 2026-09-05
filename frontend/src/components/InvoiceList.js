import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from './SkeletonLoader';
import DeleteModal from './DeleteModal';

function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const toast = useToast();

    // Format date to DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    useEffect(() => {
        loadInvoices().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInvoices = async () => {
        try {
            const response = await getInvoices();
            setInvoices(response.data || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast.error('Failed to load invoices.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedInvoice) {
            try {
                await deleteInvoice(selectedInvoice.id);
                setShowDeleteModal(false);
                toast.success(`Invoice #${selectedInvoice.invoiceNumber} deleted and stock restored.`);
                setSelectedInvoice(null);
                await loadInvoices();
            } catch (error) {
                console.error('Error deleting invoice:', error);
                const message = error?.response?.data?.message || error.message;
                toast.error('Error deleting invoice: ' + message);
            }
        }
    };

    // Calculate metrics
    const totalInvoicesCount = invoices.length;
    const totalBilledAmount = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const totalDueAmount = invoices.reduce((s, i) => s + (Number(i.amountDue) || 0), 0);

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        const isPaid = Number(inv.amountDue || 0) <= 0;
        let matchesStatus = true;
        if (statusFilter === 'PAID') matchesStatus = isPaid;
        if (statusFilter === 'DUE') matchesStatus = !isPaid;

        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (inv.customerName || '').toLowerCase().includes(q) ||
            (inv.invoiceNumber || '').toLowerCase().includes(q) ||
            (inv.customerContact || '').toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
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
            {/* Header & New Sale Action */}
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
                        📋 <span>All Invoices &amp; Bills</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Browse, filter, print, and manage customer billing records
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/create-invoice')}
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
                        ⚡ New Sale Bill
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Invoices</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {totalInvoicesCount}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Sales Billed</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#2e7d32', marginTop: '4px' }}>
                        ₹{totalBilledAmount.toLocaleString('en-IN')}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Outstanding Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#c62828', marginTop: '4px' }}>
                        ₹{totalDueAmount.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Search & Status Filter Controls */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                {/* Search Bar */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search customer name, phone number, or invoice #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '11px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-body)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }}
                    />
                </div>

                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'ALL', label: 'All Bills' },
                        { id: 'PAID', label: '🟢 Fully Paid' },
                        { id: 'DUE', label: '🟡 Has Due' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: statusFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                background: statusFilter === tab.id ? 'var(--primary)' : 'var(--bg-body)',
                                color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#ffffff' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', width: '130px' }}>Invoice #</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Customer Details</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', width: '120px' }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', width: '120px' }}>Total (₹)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '140px' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        📋 No invoices found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const isPaid = (Number(inv.amountDue || 0) <= 0);
                                    return (
                                        <tr
                                            key={inv.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 35, 126, 0.03)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 16px', fontWeight: '800', color: 'var(--primary)' }}>
                                                {inv.invoiceNumber}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                    {inv.customerName}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {inv.customerContact && inv.customerContact !== 'N/A' && <span>📞 {inv.customerContact}</span>}
                                                    {inv.deliveryAddress && inv.deliveryAddress !== 'N/A' && <span> • 📍 {inv.deliveryAddress}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                                {formatDate(inv.createdAt)}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>
                                                ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    background: isPaid ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                                    color: isPaid ? '#2e7d32' : '#e65100'
                                                }}>
                                                    {isPaid ? 'PAID' : `DUE ₹${Number(inv.amountDue).toLocaleString('en-IN')}`}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        onClick={() => navigate(`/invoice/${inv.id}`)}
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
                                                        title="Print / View Invoice"
                                                    >
                                                        🖨️ View
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/edit-invoice/${inv.id}`)}
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
                                                        title="Edit Invoice"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(inv)}
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
                                                        title="Delete Invoice"
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

            {/* Delete Confirmation Modal */}
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
