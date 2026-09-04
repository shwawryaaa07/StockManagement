import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getDashboard, getInvoices, getProducts } from '../services/api';
import api from '../services/api';
import { CardSkeleton, TableSkeleton } from './SkeletonLoader';
import KpiCard from './KpiCard';
import Icon from './Icon';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

export function Dashboard() {
  usePageTitle('Dashboard');
  const navigate = useNavigate();

  const [data, setData] = useState({
    todaySales: 0,
    todayInvoices: 0,
    dueInvoicesCount: 0,
    totalDueAmount: 0,
    monthlySales: []
  });
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [expiringWarranties, setExpiringWarranties] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getDashboard(),
        getInvoices(),
        getProducts(),
        api.get('/invoices/warranty-expiring?days=30').catch(() => ({ data: [] }))
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.data) {
        setData(results[0].value.data);
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value?.data)) {
        setInvoices(results[1].value.data);
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value?.data)) {
        setProducts(results[2].value.data);
      }
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value?.data)) {
        setExpiringWarranties(results[3].value.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived inventory statistics
  const totalUnitsInStock = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0);
  const lowStockProducts = products.filter(p => (Number(p.quantity) || 0) <= (p.lowStockThreshold || 2));

  // Chart data
  const chartData = data.monthlySales && data.monthlySales.length > 0
    ? data.monthlySales
    : [
        { month: 'Last 5M', sales: 0, invoices: 0 },
        { month: 'Last 4M', sales: 0, invoices: 0 },
        { month: 'Last 3M', sales: 0, invoices: 0 },
        { month: 'Last 2M', sales: 0, invoices: 0 },
        { month: 'Last M', sales: 0, invoices: 0 },
        { month: 'This Month', sales: Number(data.todaySales || 0), invoices: Number(data.todayInvoices || 0) }
      ];

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '40px' }} className="skeleton skeleton-title" />
        <CardSkeleton count={4} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <TableSkeleton rows={5} cols={3} />
          <TableSkeleton rows={5} cols={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Shop Command Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500' }}>
            Real-time sales, inventory register &amp; customer warranties
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/create-invoice')}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon name="receipt" size={16} /> + Create New Bill
          </button>
          <button
            onClick={loadData}
            className="btn-cancel"
            style={{ padding: '10px 14px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh data"
          >
            <Icon name="refresh" size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Metric Cards */}
      <div className="dash-kpi-grid" style={{ marginBottom: '24px' }}>
        <KpiCard
          title="Today's Gross Sales"
          value={formatCurrency(data.todaySales || 0)}
          subtitle="Gross counter receipts"
          icon="trending-up"
          color="success"
          onClick={() => navigate('/reports')}
        />
        <KpiCard
          title="Today's Invoices"
          value={data.todayInvoices || 0}
          subtitle="Transactions billed today"
          icon="receipt"
          color="primary"
          onClick={() => navigate('/invoices')}
        />
        <KpiCard
          title="Outstanding Dues"
          value={formatCurrency(data.totalDueAmount || 0)}
          subtitle={`${data.dueInvoicesCount || 0} pending customer payments`}
          icon="alert-circle"
          color="danger"
          onClick={() => navigate('/invoices?status=DUE')}
        />
        <KpiCard
          title="Total Stock Value"
          value={formatCurrency(totalInventoryValue)}
          subtitle={`${totalUnitsInStock} units in ${products.length} products`}
          icon="boxes"
          color="purple"
          badge={lowStockProducts.length > 0 ? `${lowStockProducts.length} Low Stock` : undefined}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* 6-Month Sales Trend Chart (Recharts) */}
      <div className="card" style={{ padding: '22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="bar-chart" size={20} />
              <span>6-Month Revenue &amp; Sales Trend</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Monthly gross sales volume
            </p>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="btn-cancel"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="reports" size={14} /> Full Analytics
          </button>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary, #64748b)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--text-secondary, #64748b)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #ffffff)'
                }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Gross Revenue']}
              />
              <Bar dataKey="sales" fill="var(--gold, #f59e0b)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Warranty Expiring Soon Widget (Phase 6) */}
      {expiringWarranties.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#f59e0b' }}>
                <Icon name="warranty" size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Warranties Expiring Soon (Next 30 Days)
              </h3>
            </div>
            <span className="badge badge--warning">{expiringWarranties.length} items</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {expiringWarranties.slice(0, 4).map((w, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{w.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cust: {w.customerName} ({w.customerContact || 'No phone'})</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expiry: {formatDate(w.expiryDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${w.daysRemaining <= 7 ? 'badge--danger' : 'badge--warning'}`}>
                    {w.daysRemaining <= 0 ? 'Expired' : `${w.daysRemaining}d left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid: Recent Invoices & Low Stock Inventory */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Recent Invoices Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="receipt" size={18} />
              <span>Recent Invoices</span>
            </h3>
            <button
              onClick={() => navigate('/invoices')}
              className="btn-cancel"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
            >
              View All &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/invoice/${inv.id}`)}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                className="hover-lift"
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {inv.customerName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{inv.invoiceNumber}</span>
                    <span>&bull;</span>
                    <span>{formatDate(inv.createdAt)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {formatCurrency(inv.totalAmount)}
                  </div>
                  <span className={`badge badge--${inv.paymentStatus === 'FULLY_PAID' ? 'success' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'danger'}`} style={{ marginTop: '2px' }}>
                    {inv.paymentStatus === 'FULLY_PAID' ? 'PAID' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIAL' : 'DUE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="boxes" size={18} />
              <span>Low Stock Alerts</span>
            </h3>
            <button
              onClick={() => navigate('/products')}
              className="btn-cancel"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
            >
              Manage &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                All products have healthy stock levels!
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Mod: {prod.modelNumber || 'N/A'} &bull; {prod.category || 'General'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${prod.quantity <= 0 ? 'badge--danger' : 'badge--warning'}`}>
                      {prod.quantity <= 0 ? 'Out of Stock' : `${prod.quantity} Left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
