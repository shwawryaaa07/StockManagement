import React, { useState, useEffect } from 'react';
import { getDueInvoices, recordPayment } from '../services/api';

function DueInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [paymentAmounts, setPaymentAmounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

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

    const handlePayment = async (id) => {
        const amount = paymentAmounts[id];

        if (!amount || amount <= 0) {
            setMessage('⚠️ Please enter a valid amount');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        const invoice = invoices.find(i => i.id === id);
        if (amount > invoice.amountDue) {
            setMessage(`⚠️ Amount cannot exceed due amount (₹${invoice.amountDue})`);
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            await recordPayment(id, amount);
            setMessage(`✅ Payment of ₹${amount} recorded for ${invoice.invoiceNumber}`);
            setTimeout(() => setMessage(''), 3000);
            loadDueInvoices();
            setPaymentAmounts({ ...paymentAmounts, [id]: '' });
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            const fallbackMessage = error instanceof Error ? error.message : String(error);
            setMessage('❌ Error recording payment: ' + (apiMessage || fallbackMessage));
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const styles = {
        container: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
        title: { marginBottom: '5px', color: 'var(--text-primary)' },
        subtitle: { color: 'var(--text-muted)', marginBottom: '20px' },
        message: {
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
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
            backgroundColor: 'var(--bg-card)',
            padding: '15px 25px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)',
            minWidth: '150px'
        },
        summaryLabel: {
            fontSize: '14px',
            color: 'var(--text-muted)'
        },
        summaryNumber: {
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginTop: '5px'
        },
        tableWrapper: {
            overflowX: 'auto',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)'
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
            borderBottom: '1px solid var(--border-color)'
        },
        td: {
            padding: '12px 15px',
            verticalAlign: 'middle',
            color: 'var(--text-primary)'
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
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-primary)'
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
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow)'
        },
        emptyTitle: {
            color: 'var(--text-primary)',
            marginBottom: '10px'
        },
        emptyText: {
            color: 'var(--text-muted)'
        },
        loadingText: {
            padding: '30px',
            color: 'var(--text-primary)'
        }
    };

    if (loading) return <h2 style={styles.loadingText}>Loading...</h2>;

    const totalDue = invoices.reduce((sum, i) => sum + i.amountDue, 0);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🟡 Due Invoices</h2>
            <p style={styles.subtitle}>Invoices with pending payments</p>

            {/* ✅ FIX: Notification colors use CSS variables */}
            {message && (
                <div style={{
                    ...styles.message,
                    backgroundColor: message.includes('✅') ? 'var(--success-bg, #e8f5e9)' : 'var(--danger-bg, #ffebee)',
                    color: message.includes('✅') ? 'var(--success-text, #2e7d32)' : 'var(--danger-text, #c62828)'
                }}>
                    {message}
                </div>
            )}

            {/* Summary Cards */}
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

            {/* Table or Empty State */}
            {invoices.length === 0 ? (
                <div style={styles.emptyState}>
                    <h3 style={styles.emptyTitle}>🎉 No due invoices!</h3>
                    <p style={styles.emptyText}>All invoices are fully paid.</p>
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
                                <td style={styles.td}><strong>{invoice.invoiceNumber}</strong></td>
                                <td style={styles.td}>{invoice.customerName}</td>
                                <td style={styles.td}>{invoice.createdAt?.split('T')[0] || 'N/A'}</td>
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
                                        >
                                            💰 Pay
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

export default DueInvoices;