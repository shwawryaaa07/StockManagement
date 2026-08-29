import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueInvoices, recordPayment } from '../services/api';

function DueInvoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');

    // Payment Settlement Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [settleAmount, setSettleAmount] = useState('');
    const [submittingPayment, setSubmittingPayment] = useState(false);

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

    const handleOpenSettleModal = (inv) => {
        setSelectedInvoice(inv);
        setSettleAmount(String(inv.amountDue || ''));
        setMessage('');
    };

    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        const amt = parseFloat(settleAmount);

        if (!amt || amt <= 0) {
            alert('⚠️ Please enter a valid payment amount.');
            return;
        }

        if (amt > selectedInvoice.amountDue) {
            alert(`⚠️ Amount cannot exceed the remaining due amount (₹${selectedInvoice.amountDue})`);
            return;
        }

        setSubmittingPayment(true);

        try {
            await recordPayment(selectedInvoice.id, amt);
            setMessage(`✅ Payment of ₹${amt.toLocaleString('en-IN')} recorded for ${selectedInvoice.invoiceNumber}!`);
            setSelectedInvoice(null);
            setSettleAmount('');
            await loadDueInvoices();
            setTimeout(() => setMessage(''), 4000);
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            alert('❌ Error recording payment: ' + (apiMessage || fallbackMessage));
        }

        setSubmittingPayment(false);
    };

    // Calculate metrics
    const totalDueCount = invoices.length;
    const totalOutstandingAmount = invoices.reduce((s, i) => s + (Number(i.amountDue) || 0), 0);

    const filteredInvoices = invoices.filter(inv => {
        const q = searchTerm.toLowerCase();
        return (
            (inv.customerName || '').toLowerCase().includes(q) ||
            (inv.invoiceNumber || '').toLowerCase().includes(q) ||
            (inv.customerContact || '').toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div style={{ padding: '40px 20px', maxWidth: '1350px', margin: '0 auto' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Loading pending dues...</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '24px 20px' }}>
            {/* Header */}
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
                        🟡 <span>Due Invoices &amp; Credit Ledger</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Track pending customer dues and record settlements
                    </p>
                </div>
            </div>

            {/* Notification message */}
            {message && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(76, 175, 80, 0.15)',
                    color: '#2e7d32',
                    fontWeight: '700',
                    fontSize: '13px',
                    marginBottom: '20px',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                    {message}
                </div>
            )}

            {/* Outstanding Summary Hero */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Customers With Pending Dues
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#e65100', marginTop: '4px' }}>
                        {totalDueCount}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #1a237e, #0d1445)',
                    color: '#ffffff',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Total Outstanding Receivables
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--gold)', marginTop: '4px' }}>
                        ₹{totalOutstandingAmount.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Search Box */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Filter by customer name, phone, or invoice #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '11px 16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--bg-body)',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                    }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {filteredInvoices.length} due bill(s)
                </span>
            </div>

            {/* Due Invoices Table */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#ffffff' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', width: '130px' }}>Invoice #</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Customer Details</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', width: '120px' }}>Total Bill (₹)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', width: '120px' }}>Paid (₹)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', width: '140px' }}>Balance Due (₹)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '200px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#2e7d32', fontSize: '14px', fontWeight: '600' }}>
                                        🎉 No due invoices found! All customer bills are fully paid.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
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
                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2e7d32', fontWeight: '600' }}>
                                            ₹{Number(inv.amountPaid || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#c62828', fontSize: '14px' }}>
                                            ₹{Number(inv.amountDue || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleOpenSettleModal(inv)}
                                                    className="btn-success"
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    💰 Settle Due
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/invoice/${inv.id}`)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-body)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="View Bill"
                                                >
                                                    👁️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Settle Payment Modal */}
            {selectedInvoice && (
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
                        maxWidth: '460px',
                        padding: '24px',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                💰 Settle Payment
                            </h3>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{selectedInvoice.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Invoice:</span>
                                <strong style={{ color: 'var(--primary)' }}>{selectedInvoice.invoiceNumber}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Current Due Balance:</span>
                                <strong style={{ color: '#c62828', fontSize: '15px' }}>
                                    ₹{Number(selectedInvoice.amountDue || 0).toLocaleString('en-IN')}
                                </strong>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        Amount Received Now (₹) *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setSettleAmount(String(selectedInvoice.amountDue))}
                                        style={{
                                            background: '#e8f5e9',
                                            color: '#2e7d32',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Full Settle (100%)
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    value={settleAmount}
                                    onChange={(e) => setSettleAmount(e.target.value)}
                                    placeholder="Enter amount received"
                                    min="0.01"
                                    max={selectedInvoice.amountDue}
                                    step="0.01"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid var(--primary)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-body)',
                                        color: 'var(--text-primary)',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(null)}
                                    className="btn-cancel"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="btn-success"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: '700' }}
                                >
                                    {submittingPayment ? 'Recording...' : '✅ Confirm Payment'}
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
