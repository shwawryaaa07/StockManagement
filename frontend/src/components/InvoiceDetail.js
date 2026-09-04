import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getStoreProfile, saveStoreProfile, getUpiPaymentUri } from '../services/storeProfile';
import { InvoiceDetailSkeleton } from './SkeletonLoader';
import Icon from './Icon';
import { formatDate } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isVisitor } = useAuth();
    const toast = useToast();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storeProfile, setStoreProfile] = useState(() => getStoreProfile(isVisitor));
    const [printMode, setPrintMode] = useState('A4'); // 'A4' or 'THERMAL'
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [editingUpiInModal, setEditingUpiInModal] = useState(false);
    const [tempUpiInput, setTempUpiInput] = useState('');

    usePageTitle(invoice ? `Invoice #${invoice.invoiceNumber}` : 'Invoice Details');

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
            toast.error('Failed to load invoice details.');
        } finally {
            setLoading(false);
        }
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

        const itemsList = (invoice.items || []).map((it, idx) => {
            const warrantyText = it.warrantyMonths ? ` [Warranty: ${it.warrantyMonths}M ${it.warrantyType || ''}]` : '';
            return `${idx + 1}. ${it.product?.name || it.productName || 'Product'} (Qty: ${it.quantity})${warrantyText} - ₹${(it.quantity * it.unitPrice).toLocaleString('en-IN')}`;
        }).join('\n');

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
        toast.success('Opening WhatsApp to share bill...');
    };

    if (loading) {
        return (
            <div className="page-container" style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <InvoiceDetailSkeleton />
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

    const dueAmount = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.amountDue || 0));
    const upiPayableAmount = dueAmount > 0 ? dueAmount : Number(invoice.totalAmount || 0);
    const upiString = getUpiPaymentUri(storeProfile, upiPayableAmount, invoice.invoiceNumber);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

    const handleSaveQuickUpi = (e) => {
        e.preventDefault();
        let clean = tempUpiInput.trim();
        if (!clean) {
            toast.warning('Please enter a valid UPI ID or mobile number.');
            return;
        }
        if (!clean.includes('@') && /^\d{10}$/.test(clean)) {
            clean = `${clean}@upi`;
        }
        const updated = saveStoreProfile({ upiId: clean }, isVisitor);
        setStoreProfile(updated);
        setEditingUpiInModal(false);
        toast.success(`UPI Receiver ID updated to: ${clean}`);
    };

    // Dynamic Shop Info based on Role (hides confidential store info in Demo Sandbox)
    const displayShopAddress = isVisitor
        ? "Sample Commercial Hub, Panaji - Goa"
        : storeProfile.address;

    const displayShopPhone = isVisitor
        ? "📞 +91 98000 00000"
        : "📞 " + storeProfile.phone;

    const displayGSTIN = isVisitor
        ? "30AAAAA0000A1Z5"
        : storeProfile.gstin;

    const displayShopName = isVisitor
        ? "DEMO STORE"
        : storeProfile.shopName;

    return (
        <div className="page-container" style={{ maxWidth: '1080px', margin: '0 auto' }}>
            {/* Action Bar (Hidden on Print) */}
            <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <button
                    onClick={() => navigate('/invoices')}
                    className="btn-cancel"
                    style={{ padding: '9px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                    <Icon name="chevron-left" size={14} /> Back to Invoices
                </button>

                {/* Print Format Selector & Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '3px',
                        gap: '3px'
                    }}>
                        <button
                            onClick={() => setPrintMode('A4')}
                            style={{
                                border: 'none',
                                background: printMode === 'A4' ? 'var(--gold)' : 'transparent',
                                color: printMode === 'A4' ? '#0f172a' : 'var(--text-secondary)',
                                fontWeight: printMode === 'A4' ? '800' : '600',
                                fontSize: '12px',
                                padding: '6px 12px',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            📄 A4 Tax Bill
                        </button>
                        <button
                            onClick={() => setPrintMode('THERMAL')}
                            style={{
                                border: 'none',
                                background: printMode === 'THERMAL' ? 'var(--gold)' : 'transparent',
                                color: printMode === 'THERMAL' ? '#0f172a' : 'var(--text-secondary)',
                                fontWeight: printMode === 'THERMAL' ? '800' : '600',
                                fontSize: '12px',
                                padding: '6px 12px',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            🧾 Thermal Slip
                        </button>
                    </div>

                    <button
                        onClick={() => setShowUpiModal(true)}
                        style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '9px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Icon name="credit-card" size={15} /> Show UPI QR
                    </button>

                    <button
                        onClick={handleWhatsAppShare}
                        className="btn-whatsapp"
                        style={{ padding: '9px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Share tax invoice receipt on WhatsApp"
                    >
                        <Icon name="share" size={15} /> Share WhatsApp
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn-primary"
                        style={{ padding: '9px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Icon name="print" size={15} /> Print {printMode === 'A4' ? 'Tax Invoice' : 'Thermal Slip'}
                    </button>
                </div>
            </div>

            {/* UPI QR CODE MODAL */}
            {showUpiModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => {
                        setShowUpiModal(false);
                        setEditingUpiInModal(false);
                    }}
                >
                    <div
                        className="upi-qr-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ fontWeight: '800', fontSize: '16px' }}>📱 Scan &amp; Pay via UPI</div>
                            <button
                                onClick={() => {
                                    setShowUpiModal(false);
                                    setEditingUpiInModal(false);
                                }}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                            <img
                                src={qrUrl}
                                alt="UPI Payment QR Code"
                                style={{ width: '210px', height: '210px', display: 'block' }}
                            />
                        </div>

                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
                            ₹{upiPayableAmount.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            Pay to: <strong>{storeProfile.shopName}</strong> &bull; UPI: <strong>{storeProfile.upiId || 'Not Configured'}</strong>
                        </div>

                        {/* Inline UPI ID Configuration */}
                        {!editingUpiInModal ? (
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempUpiInput(storeProfile.upiId || '');
                                        setEditingUpiInModal(true);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    ⚙️ Change Receiving UPI ID / Mobile Number
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveQuickUpi} style={{ marginTop: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                    Enter Receiving UPI ID or 10-Digit Mobile:
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        value={tempUpiInput}
                                        onChange={(e) => setTempUpiInput(e.target.value)}
                                        placeholder="Enter UPI ID or mobile number"
                                        style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                    <button type="submit" style={{ padding: '6px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                        Save
                                    </button>
                                    <button type="button" onClick={() => setEditingUpiInModal(false)} style={{ padding: '6px 8px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                        ✕
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="upi-badge-row">
                            <span className="upi-badge">Google Pay</span>
                            <span className="upi-badge">PhonePe</span>
                            <span className="upi-badge">Paytm</span>
                            <span className="upi-badge">BHIM UPI</span>
                        </div>
                    </div>
                </div>
            )}

            {/* HIGH-CONTRAST DOCUMENT CANVAS PREVIEW STAGE */}
            <div className="invoice-preview-stage" style={{
                background: 'rgba(0, 0, 0, 0.22)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '32px 20px',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
            }}>
                {printMode === 'A4' ? (
                    /* A4 TAX INVOICE PAPER */
                    <div className="invoice-paper" style={{
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '16px',
                        padding: '36px',
                        maxWidth: '820px',
                        width: '100%',
                        margin: '0 auto',
                        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.12)',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box'
                    }}>
                        {/* Shop Letterhead Header */}
                        <div style={{
                            borderBottom: '2px solid #0f172a',
                            paddingBottom: '18px',
                            marginBottom: '20px',
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
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '380px', lineHeight: '1.4' }}>
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
                            padding: '14px 18px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                                    Billed To (Customer):
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '3px' }}>
                                    {invoice.customerName}
                                </div>
                                {invoice.deliveryAddress && invoice.deliveryAddress !== 'N/A' && (
                                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                        📍 {invoice.deliveryAddress}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                                    Contact &amp; Payment:
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '3px' }}>
                                    📞 {invoice.customerContact || 'N/A'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                    Method: <strong>{invoice.paymentMethod || 'CASH'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Items Table with Horizontal Scroll Protection for Mobile */}
                        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '480px' }}>
                                <thead>
                                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '36px' }}>#</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item Description / Model</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Qty</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '100px' }}>Rate (₹)</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items || []).map((it, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>{idx + 1}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ fontWeight: '800', color: '#0f172a' }}>{it.product?.name || it.productName || 'Product'}</div>
                                                {it.modelNumber && (
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                        Mod: {it.modelNumber}
                                                    </div>
                                                )}
                                                {it.serialNumber && (
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                                                        S/N: {it.serialNumber}
                                                    </div>
                                                )}
                                                {it.warrantyMonths ? (
                                                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <span>🛡️</span> {it.warrantyMonths}M Warranty ({it.warrantyType || 'Manufacturer'})
                                                        {it.warrantyNotes && <span style={{ color: '#64748b', fontWeight: 'normal' }}> - {it.warrantyNotes}</span>}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{it.quantity}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '900', color: '#0f172a' }}>
                                                ₹{(it.quantity * it.unitPrice).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Calculation Summary Breakdown */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
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
                                    fontSize: '17px',
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
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            fontSize: '11px',
                            color: '#64748b',
                            flexWrap: 'wrap',
                            gap: '14px'
                        }}>
                            <div>
                                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '3px' }}>Terms &amp; Conditions:</div>
                                <div>1. Goods once sold will not be taken back or exchanged.</div>
                                <div>2. Warranty as per manufacturer terms &amp; conditions.</div>
                                <div>3. Subject to jurisdiction.</div>
                            </div>

                            <div style={{ textAlign: 'center', width: '160px' }}>
                                <div style={{ height: '32px' }}></div>
                                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: '800', color: '#0f172a' }}>
                                    For {displayShopName}
                                </div>
                                <div style={{ fontSize: '10px' }}>Authorized Signatory</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 3-INCH (80mm) THERMAL POS SLIP */
                    <div className="invoice-paper thermal-slip" style={{
                        background: '#ffffff',
                        color: '#000000',
                        fontFamily: 'monospace',
                        width: '320px',
                        padding: '20px 16px',
                        borderRadius: '12px',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.35)',
                        border: '1px solid #cbd5e1',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                            <div style={{ fontWeight: '900', fontSize: '16px' }}>{displayShopName}</div>
                            <div style={{ fontSize: '11px', marginTop: '2px' }}>{displayShopAddress}</div>
                            <div style={{ fontSize: '11px' }}>{displayShopPhone}</div>
                            <div style={{ fontSize: '11px', fontWeight: '700' }}>GSTIN: {displayGSTIN}</div>
                        </div>

                        <div style={{ fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                            <div><strong>Bill No:</strong> #{invoice.invoiceNumber}</div>
                            <div><strong>Date:</strong> {formatDate(invoice.createdAt)}</div>
                            <div><strong>Customer:</strong> {invoice.customerName}</div>
                            {invoice.customerContact && <div><strong>Phone:</strong> {invoice.customerContact}</div>}
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', marginBottom: '4px' }}>
                                <span>Item</span>
                                <span>Qty x Rate = Total</span>
                            </div>
                            {(invoice.items || []).map((it, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                    <div>{idx + 1}. {it.product?.name || 'Item'}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333' }}>
                                        <span>{it.serialNumber ? `S/N: ${it.serialNumber}` : ''}</span>
                                        <span>{it.quantity} x {Number(it.unitPrice).toLocaleString('en-IN')} = ₹{(it.quantity * it.unitPrice).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subtotal:</span>
                                <span>₹{Number(invoice.subtotal || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>GST ({invoice.gstRate}%):</span>
                                <span>₹{Number(invoice.gstAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '15px', marginTop: '4px' }}>
                                <span>Total:</span>
                                <span>₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '700' }}>
                                <span>Paid:</span>
                                <span>₹{Number(invoice.amountPaid || 0).toLocaleString('en-IN')}</span>
                            </div>
                            {Number(invoice.balanceDue || invoice.amountDue || 0) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: '900' }}>
                                    <span>Due:</span>
                                    <span>₹{Number(invoice.balanceDue || invoice.amountDue).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>
                            <div>*** Thank You! Visit Again ***</div>
                            <div>Warranty as per brand policy.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvoiceDetail;
