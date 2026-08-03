import React, { useState, useEffect } from 'react';
import { getDueInvoices, recordPayment } from '../services/api';

function DueInvoices() {
    // ============================================================
    // STATE - Data that can change
    // ============================================================
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentAmounts, setPaymentAmounts] = useState({});
    const [processing, setProcessing] = useState({});
    const [message, setMessage] = useState('');

    // ============================================================
    // EFFECTS - Runs when page loads
    // ============================================================
    useEffect(() => {
        loadDueInvoices();
    }, []);

    const loadDueInvoices = async () => {
        try {
            const response = await getDueInvoices();
            setInvoices(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading due invoices:', error);
            setLoading(false);
        }
    };

    // ============================================================
    // FUNCTIONS
    // ============================================================

    const handlePayment = async (id) => {
        const amount = paymentAmounts[id];

        if (!amount || amount <= 0) {
            setMessage('⚠️ Please enter a valid amount');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // Check if amount exceeds due
        const invoice = invoices.find(i => i.id === id);
        if (amount > invoice.amountDue) {
            setMessage(`⚠️ Amount cannot exceed due amount (₹${invoice.amountDue})`);
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setProcessing({ ...processing, [id]: true });

        try {
            await recordPayment(id, amount);
            setMessage(`✅ Payment of ₹${amount} recorded for ${invoice.invoiceNumber}`);
            setTimeout(() => setMessage(''), 3000);
            loadDueInvoices(); // Refresh the list
            setPaymentAmounts({ ...paymentAmounts, [id]: '' });
        } catch (error) {
            setMessage('❌ Error recording payment: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setMessage(''), 3000);
        }

        setProcessing({ ...processing, [id]: false });
    };

    // ============================================================
    // RENDER - What the user sees
    // ============================================================

    if (loading) return <h2 style={{ padding: '30px' }}>Loading...</h2>;

    // Calculate totals
    const totalDue = invoices.reduce((sum, i) => sum + i.amountDue, 0);

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '5px' }}>🟡 Due Invoices</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Invoices with pending payments
            </p>

            {/* Message */}
            {message && (
                <div style={{
                    ...styles.message,
                    backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                    color: message.includes('✅') ? '#2e7d32' : '#c62828'
                }}>
                    {message}
                </div>
            )}

            {/* Summary */}
            <div style={styles.summaryContainer}>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>📋 Due Invoices</span>
                    <span style={styles.summaryNumber}>{invoices.length}</span>
                </div>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>💰 Total Due</span>
                    <span style={styles.summaryNumber}>₹{totalDue.toLocaleString()}</span>
                </div>
            </div>

            {/* Table */}
            {invoices.length === 0 ? (
                <div style={styles.emptyState}>
                    <h3>🎉 No due invoices!</h3>
                    <p>All invoices are fully paid.</p>
                </div>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHead}>
                            <th style={styles.th}>Invoice</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Paid</th>
                            <th style={styles.th}>Due</th>
                            <th style={styles.th}>Record Payment</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} style={styles.tableRow}>
                                <td style={styles.td}>
                                    <strong>{invoice.invoiceNumber}</strong>
                                </td>
                                <td style={styles.td}>{invoice.customerName}</td>
                                <td style={styles.td}>
                                    {invoice.createdAt ? invoice.createdAt.split('T')[0] : 'N/A'}
                                </td>
                                <td style={styles.td}>₹{invoice.totalAmount.toLocaleString()}</td>
                                <td style={styles.td}>₹{invoice.amountPaid.toLocaleString()}</td>
                                <td style={{ ...styles.td, ...styles.dueAmount }}>
                                    ₹{invoice.amountDue.toLocaleString()}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.paymentRow}>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={paymentAmounts[invoice.id] || ''}
                                            onChange={(e) => setPaymentAmounts({
                                                ...paymentAmounts,
                                                [invoice.id]: parseFloat(e.target.value) || ''
                                            })}
                                            style={styles.paymentInput}
                                            min="0"
                                            step="1"
                                        />
                                        <button
                                            onClick={() => handlePayment(invoice.id)}
                                            style={styles.payBtn}
                                            disabled={processing[invoice.id]}
                                        >
                                            {processing[invoice.id] ? '⏳' : '💰 Pay'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
    message: {
        padding: '12px 20px',
        borderRadius: '5px',
        marginBottom: '20px',
        fontWeight: 'bold'
    },
    summaryContainer: {
        display: 'flex',
        gap: '20px',
        marginBottom: '25px',
        flexWrap: 'wrap'
    },
    summaryCard: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        padding: '15px 25px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '150px'
    },
    summaryLabel: {
        fontSize: '14px',
        color: '#666'
    },
    summaryNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1a237e',
        marginTop: '5px'
    },
    tableWrapper: {
        overflowX: 'auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHead: {
        backgroundColor: '#1a237e',
        color: 'white'
    },
    th: {
        padding: '12px 15px',
        textAlign: 'left'
    },
    tableRow: {
        borderBottom: '1px solid #eee'
    },
    td: {
        padding: '12px 15px',
        verticalAlign: 'middle'
    },
    dueAmount: {
        color: '#f44336',
        fontWeight: 'bold'
    },
    paymentRow: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    paymentInput: {
        width: '100px',
        padding: '6px 10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    },
    payBtn: {
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        padding: '6px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }
};

export default DueInvoices;