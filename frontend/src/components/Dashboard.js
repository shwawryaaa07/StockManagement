import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getInvoices } from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

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
                console.error(e);
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="dashboard"><h2>Loading...</h2></div>;
    if (!data) return <div className="dashboard"><h2>No data</h2></div>;

    return (
        <div className="dashboard">
            <div className="dash-header">
                <h1 className="dash-title">📊 Dashboard</h1>
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

            <div className="quick-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-primary" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }} onClick={() => navigate('/create-invoice')}>
                    ➕ New Invoice
                </button>
                <button className="btn-secondary" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }} onClick={() => navigate('/products')}>
                    📦 Add Product
                </button>
                <button className="btn-success" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }} onClick={() => navigate('/due-invoices')}>
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