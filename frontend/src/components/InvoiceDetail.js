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

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    };

    if (loading) return <div className="dashboard"><h2>Loading...</h2></div>;
    if (!invoice) return <div className="dashboard"><h2>Invoice not found</h2></div>;

    return (
        <div className="dashboard">
            {/* Printable Invoice */}
            <div ref={printRef} style={{
                background: 'white',
                padding: '30px',
                maxWidth: '800px',
                margin: '0 auto',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #1a237e', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, color: '#1a237e', fontSize: '24px' }}>MANISHA ELECTRONICS</h1>
                    <p style={{ margin: '5px 0', color: '#555' }}>123 Shop Street, City</p>
                    <p style={{ margin: '5px 0', color: '#555' }}>GSTIN: 22AAAAA0000A1Z5 | Phone: 9876543210</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
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

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#1a237e', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{item.product?.name || 'Product'}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>₹{item.unitPrice?.toLocaleString()}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>₹{item.totalPrice?.toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No items found</td></tr>
                    )}
                    </tbody>
                </table>

                <div style={{ textAlign: 'right', borderTop: '2px solid #ddd', paddingTop: '15px' }}>
                    <p><strong>Subtotal:</strong> ₹{invoice.subtotal?.toLocaleString() || 0}</p>
                    <p><strong>GST ({invoice.gstRate || 18}%):</strong> ₹{invoice.gstAmount?.toLocaleString() || 0}</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Total: ₹{invoice.totalAmount?.toLocaleString() || 0}</p>
                    <p><strong>Paid:</strong> ₹{invoice.amountPaid?.toLocaleString() || 0}</p>
                    <p style={{ color: invoice.amountDue > 0 ? '#f44336' : '#4caf50' }}>
                        <strong>Due:</strong> ₹{invoice.amountDue?.toLocaleString() || 0}
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '2px solid #1a237e', paddingTop: '15px' }}>
                    <p style={{ color: '#555' }}>Payment Mode: {invoice.paymentMode}</p>
                    <p style={{ color: '#555' }}>Status: {invoice.paymentStatus === 'FULLY_PAID' ? '✅ FULLY PAID' : '🟡 PENDING'}</p>
                    <p style={{ color: '#1a237e', fontWeight: 'bold', marginTop: '10px' }}>Thank you for your visit! ❤️</p>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handlePrint} style={{ backgroundColor: '#1a237e', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                    🖨️ Print Invoice
                </button>
                <button onClick={() => navigate(`/edit-invoice/${invoice.id}`)} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                    ✏️ Edit Invoice
                </button>
                <button onClick={() => navigate('/invoices')} style={{ backgroundColor: '#999', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                    ⬅️ Back
                </button>
            </div>
        </div>
    );
}

export default InvoiceDetail;