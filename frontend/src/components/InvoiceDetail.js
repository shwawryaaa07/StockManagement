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
        loadInvoice().catch(console.error);
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
        window.print();
    };

    // Helper function to convert number to words
    const numberToWords = (num) => {
        if (num === 0) return 'Zero';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const numStr = num.toString();

        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
        return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    };

    if (loading) return <div style={{ padding: '30px' }}><h2 style={{ color: 'var(--text-primary)' }}>Loading...</h2></div>;
    if (!invoice) return <div style={{ padding: '30px' }}><h2 style={{ color: 'var(--text-primary)' }}>Invoice not found</h2></div>;

    const totalAmount = invoice.totalAmount || 0;
    const totalInWords = numberToWords(Math.round(totalAmount));

    const styles = {
        container: { padding: '30px' },
        invoicePaper: {
            background: 'white',
            padding: '30px',
            maxWidth: '800px',
            margin: '0 auto',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
            fontFamily: 'Times New Roman, serif',
            color: '#000'
        },
        header: {
            textAlign: 'center',
            borderBottom: '2px solid #000',
            paddingBottom: '10px',
            marginBottom: '15px'
        },
        shopName: {
            margin: 0,
            fontSize: '22px',
            fontWeight: 'bold',
            letterSpacing: '2px'
        },
        shopTagline: {
            margin: '2px 0',
            fontSize: '12px',
            fontStyle: 'italic'
        },
        shopAddress: {
            margin: '2px 0',
            fontSize: '11px'
        },
        shopContact: {
            margin: '2px 0',
            fontSize: '11px'
        },
        gstNo: {
            fontSize: '12px',
            fontWeight: 'bold',
            marginTop: '5px'
        },
        invoiceTitle: {
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            margin: '10px 0'
        },
        invoiceNoDate: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            marginBottom: '10px'
        },
        toSection: {
            fontSize: '14px',
            marginBottom: '15px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '15px',
            fontSize: '13px'
        },
        th: {
            border: '1px solid #000',
            padding: '6px 8px',
            textAlign: 'center',
            backgroundColor: '#f0f0f0',
            fontWeight: 'bold'
        },
        td: {
            border: '1px solid #000',
            padding: '6px 8px',
            verticalAlign: 'top'
        },
        totals: {
            width: '100%',
            marginBottom: '15px'
        },
        totalRow: {
            fontSize: '14px',
            padding: '4px 0'
        },
        amountInWords: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #000'
        },
        signature: {
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #000',
            textAlign: 'right',
            fontSize: '14px'
        },
        signatureLine: {
            marginTop: '40px',
            textAlign: 'right',
            fontSize: '14px'
        },
        buttonContainer: {
            textAlign: 'center',
            marginTop: '20px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        },
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
        // ✅ FIX: Back button is now RED
        backBtn: {
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
        }
    };

    return (
        <div style={styles.container}>
            {/* Printable Invoice */}
            <div ref={printRef} style={styles.invoicePaper}>
                <div style={styles.header}>
                    <div style={styles.shopName}>
                        {invoice.businessName || 'MANISHA ELECTRONIC'}
                    </div>
                    <div style={styles.shopTagline}>
                        Sales of TV, Refrigerator, Washing Machine & Other Electronic Goods.
                    </div>
                    <div style={styles.shopAddress}>
                        {invoice.businessAddress || 'EDEN GROVE Building, Nr. State Bank of India, Opp. Govt. Higher Secondary, Thane Road, Valpoi, Satartia - Goa'}
                    </div>
                    <div style={styles.shopContact}>
                        Prop. Ramesh Naik (M) {invoice.businessPhone || '9309736172, 70205592347'}
                    </div>
                    <div style={styles.gstNo}>
                        GST No. {invoice.businessGstin || '30AMYPN1753F1ZY'}
                    </div>
                </div>

                <div style={styles.invoiceTitle}>TAX INVOICE</div>

                <div style={styles.invoiceNoDate}>
                    <span><strong>Invoice No:</strong> {invoice.invoiceNumber}</span>
                    <span><strong>Date:</strong> {invoice.createdAt?.split('T')[0]}</span>
                </div>

                <div style={styles.toSection}>
                    <strong>To:</strong> {invoice.customerName}
                    {invoice.deliveryAddress && <span> , {invoice.deliveryAddress}</span>}
                </div>

                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={styles.th} width="8%">Sr. No.</th>
                        <th style={styles.th} width="5%">Qty.</th>
                        <th style={styles.th} width="45%">Description</th>
                        <th style={styles.th} width="20%">Unit Rate</th>
                        <th style={styles.th} width="22%">Amount Rs.</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td style={styles.td}>{index + 1}</td>
                                <td style={styles.td}>{item.quantity}</td>
                                <td style={styles.td}>
                                    {item.product?.name || 'Product'}
                                    {item.product?.model && <div style={{ fontSize: '11px', color: '#555' }}>Model: {item.product.model}</div>}
                                </td>
                                <td style={styles.td}>₹{item.unitPrice?.toLocaleString()}/-</td>
                                <td style={styles.td}>₹{item.totalPrice?.toLocaleString()}/-</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No items found</td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <table style={styles.totals}>
                    <tbody>
                    <tr>
                        <td style={{ width: '70%' }}></td>
                        <td style={{ width: '30%', textAlign: 'right' }}>
                            <div><strong>Total:</strong> ₹{invoice.totalAmount?.toLocaleString()}/-</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>CGST@: {invoice.gstRate / 2}%</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>SGST@: {invoice.gstRate / 2}%</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>
                                Grand Total: ₹{invoice.totalAmount?.toLocaleString()}/-
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>

                <div style={styles.amountInWords}>
                    {totalInWords} {totalAmount % 100 !== 0 ? 'and ' + (totalAmount % 100) + '/-' : ''} only
                </div>

                <div style={styles.signature}>
                    For {invoice.businessName || 'MANISHA ELECTRONIC'}
                </div>
                <div style={styles.signatureLine}>
                    <div style={{ marginTop: '30px' }}>
                        (Signature)
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#555' }}>
                        Authorized Signatory
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div style={styles.buttonContainer}>
                <button onClick={handlePrint} style={styles.printBtn}>
                    🖨️ Print Invoice
                </button>
                <button
                    onClick={() => navigate(`/edit-invoice/${invoice.id}`)}
                    style={styles.editBtn}
                >
                    ✏️ Edit Invoice
                </button>
                {/* ✅ FIX: Back button is now RED */}
                <button onClick={() => navigate('/invoices')} style={styles.backBtn}>
                    ⬅️ Back
                </button>
            </div>
        </div>
    );
}

export default InvoiceDetail;