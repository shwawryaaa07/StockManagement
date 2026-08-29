import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getInvoices, getProducts } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        todayInvoices: 0,
        todaySales: 0,
        dueInvoicesCount: 0,
        totalDueAmount: 0,
        date: new Date().toISOString().split('T')[0]
    });
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    // Format date to DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const loadData = async () => {
        setLoading(true);
        setIsOffline(false);
        try {
            const results = await Promise.allSettled([
                getDashboard(),
                getInvoices(),
                getProducts()
            ]);

            let hadFailure = false;

            if (results[0].status === 'fulfilled' && results[0].value?.data) {
                setData(results[0].value.data);
            } else {
                hadFailure = true;
            }

            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value?.data)) {
                setInvoices(results[1].value.data);
            } else {
                hadFailure = true;
            }

            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value?.data)) {
                setProducts(results[2].value.data);
            } else {
                hadFailure = true;
            }

            setIsOffline(hadFailure);
        } catch (e) {
            console.error('Error loading dashboard data:', e);
            setIsOffline(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData().catch(console.error);
    }, []);

    // Calculations for inventory stats
    const totalInventoryCount = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);
    const lowStockItems = products.filter(p => (p.quantity || 0) <= 3);

    return (
        <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '24px 20px' }}>
            {/* Top Bar / Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 <span>Business Dashboard</span>
                    </h1>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--gold)' }}>★</span>
                        <span style={{ fontWeight: '700' }}>MANISHA ELECTRONICS</span>
                        <span>•</span>
                        <span>Complete Electronics &amp; Home Appliances Store</span>
                        <span>•</span>
                        <span>Valpoi, Sattari - Goa</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        padding: '8px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-secondary)'
                    }}>
                        📅 {formatDate(data.date || new Date())}
                    </div>
                    <button
                        onClick={() => navigate('/create-invoice')}
                        className="btn-primary"
                        style={{
                            padding: '10px 18px',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ⚡ Quick POS Sale
                    </button>
                </div>
            </div>

            {/* Offline / Connection Banner */}
            {isOffline && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 152, 0, 0.15)',
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    color: '#e65100',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <span>⚠️ Backend server connecting... (http://localhost:8080)</span>
                    <button
                        onClick={loadData}
                        style={{
                            background: '#e65100',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Retry Connection
                    </button>
                </div>
            )}

            {/* 4 Hero Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* 1. Today's Invoices */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>TODAY'S INVOICES</span>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(33, 150, 243, 0.15)', color: '#1e88e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            🧾
                        </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {data.todayInvoices || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e88e5', marginTop: '4px', fontWeight: '600' }}>
                            Transactions today
                        </div>
                    </div>
                </div>

                {/* 2. Today's Sales */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>TODAY'S SALES</span>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(76, 175, 80, 0.15)', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            💰
                        </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '800', color: '#2e7d32' }}>
                            ₹{Number(data.todaySales || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px', fontWeight: '600' }}>
                            Gross billing revenue
                        </div>
                    </div>
                </div>

                {/* 3. Due Invoices Count */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>DUE BILLS</span>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 152, 0, 0.15)', color: '#f57c00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            🟡
                        </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {data.dueInvoicesCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#f57c00', marginTop: '4px', fontWeight: '600' }}>
                            Pending customer balances
                        </div>
                    </div>
                </div>

                {/* 4. Total Outstanding Due */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>TOTAL MARKET DUE</span>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 83, 80, 0.15)', color: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            💳
                        </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '30px', fontWeight: '800', color: '#c62828' }}>
                            ₹{Number(data.totalDueAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px', fontWeight: '600' }}>
                            Outstanding receivables
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Strip */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '8px' }}>
                    ⚡ Shortcuts:
                </span>
                <button
                    onClick={() => navigate('/create-invoice')}
                    style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, var(--gold), #f57f17)',
                        color: '#1a1a2e',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    🧾 Create Invoice
                </button>
                <button
                    onClick={() => navigate('/products')}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600' }}
                >
                    📦 Manage Products ({products.length})
                </button>
                <button
                    onClick={() => navigate('/due-invoices')}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 152, 0, 0.15)',
                        color: '#e65100',
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    🟡 Settle Pending Dues ({data.dueInvoicesCount || 0})
                </button>
                <button
                    onClick={() => navigate('/invoices')}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--bg-body)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    📋 View All Invoices
                </button>
            </div>

            {/* 2-Column Split: Recent Invoices (60%) & Stock Status (40%) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* LEFT: Recent Invoices */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📋 <span>Recent Invoices</span>
                        </h3>
                        <button
                            onClick={() => navigate('/invoices')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            View All →
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent invoices...</div>
                    ) : invoices.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧾</div>
                            <div style={{ fontWeight: '600' }}>No invoices recorded yet</div>
                            <button
                                onClick={() => navigate('/create-invoice')}
                                className="btn-primary"
                                style={{ marginTop: '12px', padding: '8px 16px', fontSize: '13px' }}
                            >
                                Generate First Invoice
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Invoice #</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Customer</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.slice(0, 6).map((inv) => {
                                        const isPaid = (Number(inv.amountDue || 0) <= 0);
                                        return (
                                            <tr
                                                key={inv.id}
                                                style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26, 35, 126, 0.03)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--primary)' }}>
                                                    {inv.invoiceNumber}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {inv.customerName}
                                                    </div>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {formatDate(inv.createdAt)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                    ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        background: isPaid ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                                        color: isPaid ? '#2e7d32' : '#e65100'
                                                    }}>
                                                        {isPaid ? 'PAID' : `DUE ₹${Number(inv.amountDue).toLocaleString('en-IN')}`}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-body)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Print/View Bill"
                                                    >
                                                        👁️ View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RIGHT: Inventory Valuation & Low Stock Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Inventory Summary Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                📦 Inventory Summary
                            </h3>
                            <button
                                onClick={() => navigate('/products')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                            >
                                All Products →
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL UNITS IN STOCK</div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {totalInventoryCount}
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>STOCK VALUATION</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                                    ₹{totalInventoryValue.toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#c62828', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ⚠️ <span>Low Stock Watchlist ({lowStockItems.length})</span>
                            </h3>
                        </div>

                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Checking inventory...</div>
                        ) : lowStockItems.length === 0 ? (
                            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#2e7d32', fontSize: '13px' }}>
                                ✅ All products are well stocked!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {lowStockItems.slice(0, 5).map(p => (
                                    <div
                                        key={p.id}
                                        style={{
                                            padding: '12px 20px',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                {p.name}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                ₹{Number(p.price || 0).toLocaleString('en-IN')} | {p.category || 'General'}
                                            </span>
                                        </div>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            background: p.quantity === 0 ? 'rgba(239, 83, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                            color: p.quantity === 0 ? '#c62828' : '#e65100'
                                        }}>
                                            {p.quantity === 0 ? 'OUT OF STOCK' : `Only ${p.quantity} left`}
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
