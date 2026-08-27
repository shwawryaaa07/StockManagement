import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getInvoices } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ FIX: Proper promise handling with .catch()
    useEffect(() => {
        const load = async () => {
            try {
                const [dashRes, invRes] = await Promise.all([
                    getDashboard(),
                    getInvoices()
                ]);
                setData(dashRes.data);
                setInvoices(invRes.data.slice(0, 5));
                setLoading(false);
            } catch (e) {
                console.error('Error loading dashboard:', e);
                setLoading(false);
            }
        };
        load().catch(console.error);  // ✅ Added .catch() here
    }, []);

    if (loading) return <div className="dashboard"><h2>Loading...</h2></div>;
    if (!data) return <div className="dashboard"><h2>No data</h2></div>;

    return (
        <div className="dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">📊 Dashboard</h1>
                    <div style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ color: 'var(--gold)' }}>★</span>
                        <span style={{ fontWeight: '500' }}>MANISHA ELECTRONICS</span>
                        <span style={{ opacity: '0.4' }}>|</span>
                        <span>Sales of T.V., Refrigerator, Washing Machine &amp; Other Electronic Goods.</span>
                    </div>
                </div>
                <span className="dash-date">📅 {data.date}</span>
            </div>

            <div className="dash-cards">
                <div className="dash-card">
                    <div className="icon">🧾</div>
                    <div className="label">Today's Invoices</div>
                    <div className="value gold">{data.todayInvoices || 0}</div>
                </div>
                <div className="dash-card">
                    <div className="icon">💰</div>
                    <div className="label">Today's Sales</div>
                    <div className="value green">₹{data.todaySales?.toLocaleString() || 0}</div>
                </div>
                <div className="dash-card">
                    <div className="icon">🟡</div>
                    <div className="label">Due Invoices</div>
                    <div className="value orange">{data.dueInvoicesCount || 0}</div>
                </div>
                <div className="dash-card">
                    <div className="icon">💳</div>
                    <div className="label">Total Due</div>
                    <div className="value red">₹{data.totalDueAmount?.toLocaleString() || 0}</div>
                </div>
            </div>

            <div className="quick-actions">
                <button className="btn-primary" onClick={() => navigate('/create-invoice')}>
                    ➕ New Invoice
                </button>
                <button className="btn-secondary" onClick={() => navigate('/products')}>
                    📦 Add Product
                </button>
                <button className="btn-success" onClick={() => navigate('/due-invoices')}>
                    💳 Record Payment
                </button>
            </div>

            <div className="recent-box">
                <div className="recent-header">📋 Recent Invoices</div>
                {invoices.length === 0 ? (
                    <div className="recent-item">No invoices yet</div>
                ) : (
                    invoices.map((inv) => (
                        <div className="recent-item" key={inv.id}>
                            <div className="recent-left">
                                <span className="recent-status">
                                    {inv.paymentStatus === 'FULLY_PAID' ? '✅' : '🟡'}
                                </span>
                                <span className="recent-name">{inv.invoiceNumber}</span>
                                <span className="recent-customer">{inv.customerName}</span>
                            </div>
                            <span className={`recent-amount ${inv.paymentStatus === 'FULLY_PAID' ? 'green' : 'orange'}`}>
                                ₹{inv.totalAmount?.toLocaleString() || 0}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Dashboard;