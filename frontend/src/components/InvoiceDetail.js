import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../services/api';

function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            const response = await getInvoice(id);
            setInvoice(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading invoice:', error);
            setLoading(false);
        }
    };

    // Simple print — React won't be destroyed!
    const handlePrint = () => {
        window.print();
    };

    // ============================================================
    // STYLES WITH THEME VARIABLES
    // ============================================================

    const styles = {
        container: { padding: '30px' },
        loadingText: { padding: '30px', color: 'var(--text-primary)' },
        invoicePaper: {
            background: 'white',
            padding: '30px',
            maxWidth: '800px',
            margin: '0 auto',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)'
        },
        header: { textAlign: 'center', borderBottom: '2px solid #1a237e', paddingBottom: '15px', marginBottom: '20px' },
        shopName: { margin: 0, color: '#1a237e', fontSize: '24px' },
        shopInfo: { margin: '5px 0', color: '#555' },
        infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
        label: { fontWeight: 'bold' },
        table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
        th: { padding: '10px', textAlign: 'left', backgroundColor: '#1a237e', color: 'white' },
        td: { padding: '10px', borderBottom: '1px solid #eee' },
        totals: { textAlign: 'right', borderTop: '2px solid #ddd', paddingTop: '15px' },
        totalText: { fontSize: '20px', fontWeight: 'bold' },
        dueText: { color: '#f44336' },
        paidText: { color: '#4caf50' },
        footer: { textAlign: 'center', marginTop: '30px', borderTop: '2px solid #1a237e', paddingTop: '15px' },
        footerText: { color: '#555' },
        footerThankYou: { color: '#1a237e', fontWeight: 'bold', marginTop: '10px' },
        buttonContainer: { textAlign: 'center', marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
        printBtn: {
            backgroundColor: '#1a237e',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        },
        editBtn: {
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        },
        backBtn: {
            backgroundColor: '#999',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        }
    };

    if (loading) return <div style={styles.container}><h2 style={styles.loadingText}>Loading...</h2></div>;
    if (!invoice) return <div style={styles.container}><h2 style={styles.loadingText}>Invoice not found</h2></div>;

    return (
        <div style={styles.container}>
            {/* Printable Invoice */}
            <div ref={printRef} style={styles.invoicePaper}>
                <div style={styles.header}>
                    <h1 style={styles.shopName}>MANISHA ELECTRONICS</h1>
                    <p style={styles.shopInfo}>123 Shop Street, City</p>
                    <p style={styles.shopInfo}>GSTIN: 22AAAAA0000A1Z5 | Phone: 9876543210</p>
                </div>

                <div style={styles.infoRow}>
                    <div>
                        <p><strong>Invoice:</strong> {invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> {invoice.createdAt?.split('T')[0]}</p>
                    </div>
                    <div>
                        <p><strong>Customer:</strong> {invoice.customerName}</p>
                        <p><strong>Contact:</strong> {invoice.customerContact}</p>
                        <p><strong>Delivery:</strong> {invoice.deliveryAddress}</p>
                    </div>
                </div>

                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td style={styles.td}>{item.product?.name || 'Product'}</td>
                                <td style={styles.td}>{item.quantity}</td>
                                <td style={styles.td}>₹{item.unitPrice?.toLocaleString()}</td>
                                <td style={styles.td}>₹{item.totalPrice?.toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No items found</td></tr>
                    )}
                    </tbody>
                </table>

                <div style={styles.totals}>
                    <p><strong>Subtotal:</strong> ₹{invoice.subtotal?.toLocaleString() || 0}</p>
                    <p><strong>GST ({invoice.gstRate || 18}%):</strong> ₹{invoice.gstAmount?.toLocaleString() || 0}</p>
                    <p style={styles.totalText}>Total: ₹{invoice.totalAmount?.toLocaleString() || 0}</p>
                    <p><strong>Paid:</strong> ₹{invoice.amountPaid?.toLocaleString() || 0}</p>
                    <p style={invoice.amountDue > 0 ? styles.dueText : styles.paidText}>
                        <strong>Due:</strong> ₹{invoice.amountDue?.toLocaleString() || 0}
                    </p>
                </div>

                <div style={styles.footer}>
                    <p style={styles.footerText}>Payment Mode: {invoice.paymentMode}</p>
                    <p style={styles.footerText}>Status: {invoice.paymentStatus === 'FULLY_PAID' ? '✅ FULLY PAID' : '🟡 PENDING'}</p>
                    <p style={styles.footerThankYou}>Thank you for your visit! ❤️</p>
                </div>
            </div>

            {/* Buttons */}
            <div style={styles.buttonContainer}>
                <button onClick={handlePrint} style={styles.printBtn}>
                    🖨️ Print Invoice
                </button>
                <button onClick={() => navigate(`/edit-invoice/${invoice.id}`)} style={styles.editBtn}>
                    ✏️ Edit Invoice
                </button>
                <button onClick={() => navigate('/invoices')} style={styles.backBtn}>
                    ⬅️ Back
                </button>
            </div>
        </div>
    );
}

export default InvoiceDetail;