import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { getStoreProfile } from '../services/storeProfile';

function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isVisitor } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storeProfile, setStoreProfile] = useState(getStoreProfile);

    useEffect(() => {
        const handleProfileUpdate = (e) => {
            if (e.detail) setStoreProfile(e.detail);
        };
        window.addEventListener('store-profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('store-profile-updated', handleProfileUpdate);
    }, []);

    useEffect(() => {
        loadInvoice().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadInvoice = async () => {
        try {
            const response = await getInvoice(id);
            setInvoice(response.data);
        } catch (error) {
            console.error('Error loading invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;

        let cleanPhone = (invoice.customerContact || '').replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }

        const itemsList = (invoice.items || []).map((it, idx) => 
            `${idx + 1}. ${it.product?.name || 'Product'} (Qty: ${it.quantity}) - ₹${(it.quantity * it.unitPrice).toLocaleString('en-IN')}`
        ).join('\n');

        const displayShopName = isVisitor ? 'Manisha Electronics (Demo Sandbox)' : storeProfile.shopName;
        const displayShopFooter = isVisitor
            ? `Thank you for choosing *Manisha Electronics (Demo)*!\n📍 Goa • 📞 +91 98000 00000`
            : `Thank you for choosing *${storeProfile.shopName}*!\n📍 ${storeProfile.address} • 📞 ${storeProfile.phone}`;

        const message = 
`🏪 *${displayShopName.toUpperCase()} - TAX INVOICE*
----------------------------------------
*Invoice No:* #${invoice.invoiceNumber}
*Date:* ${formatDate(invoice.createdAt)}
*Customer:* ${invoice.customerName}
${invoice.customerContact && invoice.customerContact !== 'N/A' ? `*Phone:* ${invoice.customerContact}` : ''}

*Purchased Items:*
${itemsList}

----------------------------------------
*Subtotal:* ₹${Number(invoice.subtotal || 0).toLocaleString('en-IN')}
*GST (${invoice.gstRate}%):* ₹${Number(invoice.gstAmount || 0).toLocaleString('en-IN')}
*Grand Total:* ₹${Number(invoice.totalAmount || 0).toLocaleString('en-IN')}
*Amount Paid:* ₹${Number(invoice.amountPaid || 0).toLocaleString('en-IN')}
${Number(invoice.balanceDue || invoice.amountDue || 0) > 0 ? `*Balance Due:* ⚠️ ₹${Number(invoice.balanceDue || invoice.amountDue).toLocaleString('en-IN')}` : '*Status:* ✅ Fully Paid'}

${displayShopFooter}`;

        const encoded = encodeURIComponent(message);
        const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧾</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>Loading Tax Invoice...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>❌</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>Invoice Not Found</div>
                <button onClick={() => navigate('/invoices')} className="btn-primary" style={{ marginTop: '16px' }}>
                    View All Invoices
                </button>
            </div>
        );
    }

    // Dynamic Shop Info based on Role (hides confidential store info in Demo Sandbox)
    const displayShopAddress = isVisitor
        ? "Sample Tech Complex, Commercial Hub, Panaji - Goa (Demo Sandbox)"
        : storeProfile.address;

    const displayShopPhone = isVisitor
        ? "📞 +91 98000 00000"
        : "📞 " + storeProfile.phone;

    const displayGSTIN = isVisitor
        ? "30AAAAA0000A1Z5 (Demo)"
        : storeProfile.gstin;

    const displayShopName = isVisitor
        ? "MANISHA ELECTRONICS"
        : storeProfile.shopName;

    return (
        <div className="page-container">
            {/* Action Bar (Hidden on Print) */}
            <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <button
                    onClick={() => navigate('/invoices')}
                    className="btn-cancel"
                    style={{ padding: '9px 16px', fontSize: '13px' }}
                >
                    ← Back to Invoices
                </button>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleWhatsAppShare}
                        className="btn-whatsapp"
                        title="Share tax invoice receipt on WhatsApp"
                    >
                        📲 Share on WhatsApp
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn-primary"
                        style={{ padding: '10px 22px' }}
                    >
                        🖨️ Print Tax Invoice (A4)
                    </button>
                </div>
            </div>

            {/* Printable A4 Tax Invoice Card */}
            <div className="invoice-paper" style={{
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '850px',
                margin: '0 auto 40px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-color)'
            }}>
                {/* Shop Letterhead Header */}
                <div style={{
                    borderBottom: '2px solid #0f172a',
                    paddingBottom: '20px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                            {displayShopName}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                            ★ Complete Home Appliances &amp; Consumer Electronics
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '380px' }}>
                            {displayShopAddress}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                            {displayShopPhone} • <strong>GSTIN:</strong> {displayGSTIN}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            display: 'inline-block',
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            letterSpacing: '1px'
                        }}>
                            ORIGINAL TAX INVOICE
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>
                            #{invoice.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            <strong>Date:</strong> {formatDate(invoice.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Customer Details Box */}
                <div style={{
                    background: '#f8fafc',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '24px',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '16px'
                }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                            Billed To (Customer):
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                            {invoice.customerName}
                        </div>
                        {invoice.deliveryAddress && invoice.deliveryAddress !== 'N/A' && (
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                📍 {invoice.deliveryAddress}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                            Contact &amp; Payment:
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                            📞 {invoice.customerContact || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                            Method: <strong>{invoice.paymentMethod || 'CASH'}</strong>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '24px' }}>
                    <thead>
                        <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '40px' }}>#</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item Description / Model</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', width: '60px' }}>Qty</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Rate (₹)</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right', width: '120px' }}>Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(invoice.items || []).map((it, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>{idx + 1}</td>
                                <td style={{ padding: '10px 14px' }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{it.product?.name || 'Product'}</div>
                                    {it.serialNumber && (
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            S/N: {it.serialNumber}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '800' }}>{it.quantity}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600' }}>₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '900', color: '#0f172a' }}>
                                    ₹{(it.quantity * it.unitPrice).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Calculation Summary Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                    <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Taxable Value:</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(invoice.subtotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>GST ({invoice.gstRate}%):</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(invoice.gstAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {Number(invoice.discountAmount || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                                <span>Discount:</span>
                                <span style={{ fontWeight: '700' }}>-₹{Number(invoice.discountAmount).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderTop: '2px solid #0f172a',
                            borderBottom: '2px solid #0f172a',
                            padding: '8px 0',
                            fontSize: '18px',
                            fontWeight: '900',
                            color: '#0f172a'
                        }}>
                            <span>Grand Total:</span>
                            <span>₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '700' }}>
                            <span>Amount Paid:</span>
                            <span>₹{Number(invoice.amountPaid || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {Number(invoice.balanceDue || invoice.amountDue || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: '900', fontSize: '14px' }}>
                                <span>Balance Due:</span>
                                <span>₹{Number(invoice.balanceDue || invoice.amountDue).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Terms & Signatory */}
                <div style={{
                    borderTop: '1px dashed #cbd5e1',
                    paddingTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    fontSize: '11px',
                    color: '#64748b'
                }}>
                    <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Terms &amp; Conditions:</div>
                        <div>1. Goods once sold will not be taken back or exchanged.</div>
                        <div>2. Warranty as per manufacturer terms &amp; conditions.</div>
                        <div>3. Subject to jurisdiction.</div>
                    </div>

                    <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ height: '40px' }}></div>
                        <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: '800', color: '#0f172a' }}>
                            For MANISHA ELECTRONICS
                        </div>
                        <div style={{ fontSize: '10px' }}>Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceDetail;
