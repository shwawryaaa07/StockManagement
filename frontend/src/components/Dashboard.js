import React, { useState, useEffect } from 'react';
import { getDashboard, getInvoices } from '../services/api';

function Dashboard() {
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
                setInvoices(invRes.data.slice(0, 5)); // Last 5 invoices
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
            {/* Header */}
            <div className="dash-header">
                <h1 className="dash-title">📊 Dashboard</h1>
                <span className="dash-date">📅 {data.date}</span>
            </div>

            {/* Cards */}
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

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="quick-btn gold" onClick={() => window.location.href = '/create-invoice'}>
                    ➕ New Invoice
                </button>
                <button className="quick-btn primary" onClick={() => window.location.href = '/products'}>
                    📦 Add Product
                </button>
                <button className="quick-btn success" onClick={() => window.location.href = '/due-invoices'}>
                    💳 Record Payment
                </button>
            </div>

            {/* Recent Activity */}
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