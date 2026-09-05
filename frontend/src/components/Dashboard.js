import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getInvoices, getProducts } from '../services/api';
import { CardSkeleton, TableSkeleton } from './SkeletonLoader';

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        todaySales: 0,
        todayInvoices: 0,
        dueInvoicesCount: 0,
        totalDueAmount: 0
    });
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMountedRef = useRef(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getDashboard(),
                getInvoices(),
                getProducts()
            ]);

            if (!isMountedRef.current) return;

            if (results[0].status === 'fulfilled' && results[0].value?.data) {
                setData(results[0].value.data);
            }
            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value?.data)) {
                setInvoices(results[1].value.data);
            }
            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value?.data)) {
                setProducts(results[2].value.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        loadData();
        return () => {
            isMountedRef.current = false;
        };
    }, [loadData]);

    // Derived inventory statistics
    const totalUnitsInStock = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0);
    const lowStockProducts = products.filter(p => (Number(p.quantity) || 0) <= 2);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const getInitials = (name) => {
        if (!name) return 'C';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ height: '40px' }} className="skeleton skeleton-title" />
                <CardSkeleton count={4} />
                <div className="dash-main-grid">
                    <TableSkeleton rows={5} cols={3} />
                    <TableSkeleton rows={5} cols={3} />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header / Greeting Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                        Shop Command Center
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500' }}>
                        Real-time sales, billing register &amp; stock overview
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/create-invoice')}
                        className="btn-primary"
                        style={{ padding: '11px 22px', fontSize: '14px' }}
                    >
                        🧾 + Create New Bill
                    </button>
                    <button
                        onClick={loadData}
                        className="btn-cancel"
                        style={{ padding: '11px 16px', fontSize: '14px' }}
                        title="Refresh data"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* 4 Hero KPI Metric Cards */}
            <div className="dash-kpi-grid">
                {/* 1. Today's Gross Revenue */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today's Sales
                        </span>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--emerald-light)', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            💰
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.5px' }}>
                            ₹{Number(data.todaySales || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                            Gross counter receipts
                        </div>
                    </div>
                </div>

                {/* 2. Today's Invoices Count */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today's Bills
                        </span>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            🧾
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            {data.todayInvoices || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                            Transactions created today
                        </div>
                    </div>
                </div>

                {/* 3. Market Receivables (Due Balance) */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Outstanding Dues
                        </span>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--amber-light)', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            🟡
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', letterSpacing: '-0.5px' }}>
                            ₹{Number(data.totalDueAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: '700' }}>
                            {data.dueInvoicesCount || 0} customer(s) pending
                        </div>
                    </div>
                </div>

                {/* 4. Total Stock Asset Value */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Inventory Asset Value
                        </span>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.08)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            📦
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            ₹{totalInventoryValue.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                            {totalUnitsInStock} total units across {products.length} products
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Shortcuts Bar */}
            <div className="shortcuts-scroll-bar">
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', marginRight: '6px', flexShrink: 0 }}>
                    ⚡ Jump to:
                </span>
                <button
                    onClick={() => navigate('/create-invoice')}
                    style={{
                        padding: '9px 18px',
                        background: 'linear-gradient(135deg, var(--gold), #d97706)',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    🧾 Create Invoice
                </button>
                <button
                    onClick={() => navigate('/products')}
                    className="btn-secondary"
                    style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}
                >
                    📦 Manage Products ({products.length})
                </button>
                <button
                    onClick={() => navigate('/due-invoices')}
                    style={{
                        padding: '9px 18px',
                        background: 'var(--amber-light)',
                        color: '#92400e',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    🟡 Due Ledger ({data.dueInvoicesCount || 0})
                </button>
                <button
                    onClick={() => navigate('/invoices')}
                    style={{
                        padding: '9px 18px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    📋 View Invoices ({invoices.length})
                </button>
            </div>

            {/* 2-Column Split: Recent Bills & Inventory Health */}
            <div className="dash-main-grid">
                {/* LEFT: Recent Invoices Stream */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📋 <span>Recent Invoices</span>
                        </h2>
                        <button
                            onClick={() => navigate('/invoices')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-accent)',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            View All ({invoices.length}) →
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading recent bills...
                        </div>
                    ) : invoices.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧾</div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>No Invoices Created Yet</div>
                            <p style={{ fontSize: '13px', margin: '6px 0 16px 0' }}>Generate your first customer bill to see real-time records.</p>
                            <button
                                onClick={() => navigate('/create-invoice')}
                                className="btn-primary"
                                style={{ padding: '10px 20px', fontSize: '13px' }}
                            >
                                + Generate First Bill
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700' }}>Bill # / Customer</th>
                                        <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700' }}>Date</th>
                                        <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }}>Amount (₹)</th>
                                        <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: '700' }}>Status</th>
                                        <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: '700' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.slice(0, 6).map((inv) => (
                                        <tr
                                            key={inv.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '34px',
                                                        height: '34px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(15, 23, 42, 0.08)',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: '800',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {getInitials(inv.customerName)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                                                            {inv.customerName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            #{inv.invoiceNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                                                {formatDate(inv.createdAt)}
                                            </td>
                                            <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                                                {Number(inv.balanceDue || 0) <= 0 ? (
                                                    <span className="badge-paid">● PAID</span>
                                                ) : (
                                                    <span className="badge-due">● DUE ₹{Number(inv.balanceDue).toLocaleString('en-IN')}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => navigate(`/invoice/${inv.id}`)}
                                                    className="btn-cancel"
                                                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '700' }}
                                                >
                                                    View / Print 🖨️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RIGHT: Inventory Status & Low Stock Watchlist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Inventory Summary Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        padding: '22px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                📦 Inventory Health
                            </h3>
                            <button
                                onClick={() => navigate('/products')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                            >
                                All Products →
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Units</div>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {totalUnitsInStock}
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Catalog Items</div>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                                    {products.length}
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Valuation Breakdown:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>₹{totalInventoryValue.toLocaleString('en-IN')}</strong>
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        padding: '22px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#e11d48', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ⚠️ Low Stock Watchlist ({lowStockProducts.length})
                            </h3>
                        </div>

                        {lowStockProducts.length === 0 ? (
                            <div style={{ padding: '16px', background: 'var(--emerald-light)', borderRadius: '10px', color: '#065f46', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
                                ✅ All products are well stocked!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {lowStockProducts.slice(0, 4).map(p => (
                                    <div
                                        key={p.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            background: 'var(--bg-surface)',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #e11d48'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-primary)' }}>{p.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category} • ₹{Number(p.price).toLocaleString('en-IN')}</div>
                                        </div>
                                        <span className="badge-urgent">
                                            {p.quantity} Left
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
