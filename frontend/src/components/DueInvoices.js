import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueInvoices, settleDueInvoice } from '../services/api';

function DueInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleMethod, setSettleMethod] = useState('CASH');
    const [settleNotes, setSettleNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadDueInvoices().catch(console.error);
    }, []);

    const loadDueInvoices = async () => {
        try {
            const response = await getDueInvoices();
            setInvoices(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading due invoices:', error);
            setLoading(false);
        }
    };

    const getDueAmount = (inv) => {
        if (inv.balanceDue !== undefined && inv.balanceDue !== null) return Number(inv.balanceDue);
        if (inv.amountDue !== undefined && inv.amountDue !== null) return Number(inv.amountDue);
        return Math.max(0, Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0));
    };

    const totalDueReceivables = invoices.reduce((acc, inv) => acc + getDueAmount(inv), 0);

    const filteredInvoices = invoices.filter(inv => {
        const term = searchTerm.toLowerCase();
        return (inv.customerName || '').toLowerCase().includes(term) ||
               (inv.customerContact || '').includes(term) ||
               (inv.invoiceNumber || '').toLowerCase().includes(term);
    });

    const handleOpenSettleModal = (invoice) => {
        setSelectedInvoice(invoice);
        setSettleAmount(getDueAmount(invoice).toString());
        setSettleMethod('CASH');
        setSettleNotes('');
    };

    const handleCloseSettleModal = () => {
        setSelectedInvoice(null);
        setSettleAmount('');
        setSettleNotes('');
    };

    const handleSettleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        const amount = parseFloat(settleAmount);
        const currentDue = getDueAmount(selectedInvoice);

        if (isNaN(amount) || amount <= 0) {
            alert('⚠️ Please enter a valid payment amount');
            return;
        }

        if (amount > currentDue) {
            alert(`⚠️ Settlement amount cannot exceed outstanding due of ₹${currentDue.toLocaleString('en-IN')}`);
            return;
        }

        setSubmitting(true);
        try {
            await settleDueInvoice(selectedInvoice.id, {
                amountPaid: amount,
                paymentMethod: settleMethod,
                notes: settleNotes
            });
            handleCloseSettleModal();
            await loadDueInvoices();
            alert('✅ Payment settled successfully!');
        } catch (error) {
            console.error('Error settling invoice:', error);
            alert('❌ Failed to record payment settlement.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🟡</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>Loading Due Invoices Ledger...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🟡</span> Due Invoices &amp; Credit Ledger
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Track pending customer credit balances and record 1-click settlements
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="dashboard-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Customers With Pending Dues
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '8px' }}>
                        {invoices.length}
                    </div>
                </div>

                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '20px', borderRadius: '16px', color: '#ffffff' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase' }}>
                        Total Outstanding Receivables
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#fbbf24', marginTop: '8px' }}>
                        ₹{totalDueReceivables.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Filter by customer name, phone, or invoice #..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                    }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {filteredInvoices.length} due bill(s)
                </span>
            </div>

            {/* Table */}
            <div className="table-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '14px 18px' }}>Invoice #</th>
                                <th style={{ padding: '14px 18px' }}>Customer Details</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Total Bill (₹)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Paid (₹)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Balance Due (₹)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#10b981', fontSize: '14px', fontWeight: '700' }}>
                                        🎉 No pending customer dues found! All sales are fully settled.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const due = getDueAmount(inv);
                                    return (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--gold)' }}>
                                                {inv.invoiceNumber}
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{inv.customerName}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {inv.customerContact && <span>📞 {inv.customerContact}</span>}
                                                    {inv.deliveryAddress && <span> • 📍 {inv.deliveryAddress}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>
                                                ₹{Number(inv.amountPaid || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '900', color: '#ef4444', fontSize: '14px' }}>
                                                ₹{due.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleOpenSettleModal(inv)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: '#059669',
                                                            color: '#ffffff',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        💰 Settle Due
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-body)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="View Invoice"
                                                    >
                                                        👁️
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

            {/* Quick Settle Modal */}
            {selectedInvoice && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '20px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '440px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        color: 'var(--text-primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ fontWeight: '900', fontSize: '18px' }}>
                                💰 Settle Due Payment
                            </div>
                            <button onClick={handleCloseSettleModal} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                ✕
                            </button>
                        </div>

                        <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                                <strong>{selectedInvoice.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Invoice No:</span>
                                <strong>#{selectedInvoice.invoiceNumber}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: '900', fontSize: '15px' }}>
                                <span>Outstanding Due:</span>
                                <span>₹{getDueAmount(selectedInvoice).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSettleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Amount Received (₹) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleAmount}
                                    onChange={(e) => setSettleAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '700' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Payment Mode
                                </label>
                                <select
                                    value={settleMethod}
                                    onChange={(e) => setSettleMethod(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="CASH">💵 Cash</option>
                                    <option value="UPI">📱 UPI / GPay</option>
                                    <option value="CARD">💳 Card</option>
                                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Settlement Remarks (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={settleNotes}
                                    onChange={(e) => setSettleNotes(e.target.value)}
                                    placeholder="e.g. Cleared via PhonePe"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={handleCloseSettleModal} className="btn-cancel" style={{ padding: '10px 16px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 20px', background: '#059669' }}>
                                    {submitting ? 'Recording...' : '✅ Confirm Settlement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DueInvoices;
