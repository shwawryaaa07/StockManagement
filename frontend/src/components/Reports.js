import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';
import KpiCard from './KpiCard';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

export const Reports = () => {
  usePageTitle('Sales Reports & Analytics');
  const navigate = useNavigate();
  const toast = useToast();

  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month' | 'last_month' | 'custom'
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compute date ranges based on period
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (newPeriod === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (newPeriod === 'week') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (newPeriod === 'month') {
      const d = new Date();
      d.setDate(1);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (newPeriod === 'last_month') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setFromDate(firstDayLastMonth.toISOString().split('T')[0]);
      setToDate(lastDayLastMonth.toISOString().split('T')[0]);
    }
  };

  const fetchReport = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoices/report?from=${fromDate}&to=${toDate}`);
      if (res.data && Array.isArray(res.data)) {
        setInvoices(res.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to load sales report:', error);
      toast.error('Failed to load sales report for selected period.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalDue = 0;
    const categoryMap = {};

    invoices.forEach((inv) => {
      const amount = Number(inv.totalAmount) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const due = Number(inv.amountDue) || 0;

      totalSales += amount;
      totalPaid += paid;
      totalDue += due;

      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const cat = item.product?.category || 'General';
          const lineTotal = Number(item.totalPrice) || (Number(item.unitPrice || 0) * Number(item.quantity || 1));
          categoryMap[cat] = (categoryMap[cat] || 0) + lineTotal;
        });
      }
    });

    const avgOrderValue = invoices.length > 0 ? totalSales / invoices.length : 0;

    return {
      totalSales,
      totalPaid,
      totalDue,
      totalCount: invoices.length,
      avgOrderValue,
      categoryBreakdown: Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount
      })).sort((a, b) => b.amount - a.amount)
    };
  }, [invoices]);

  // CSV Export
  const exportToCsv = () => {
    if (invoices.length === 0) {
      toast.warning('No data to export for this period.');
      return;
    }

    const headers = ['Invoice No', 'Date', 'Customer Name', 'Customer Contact', 'Items Count', 'Total (₹)', 'Paid (₹)', 'Due (₹)', 'Payment Status', 'Payment Mode'];
    const rows = invoices.map(inv => [
      `"${inv.invoiceNumber || ''}"`,
      `"${formatDate(inv.createdAt)}"`,
      `"${(inv.customerName || '').replace(/"/g, '""')}"`,
      `"${inv.customerContact || ''}"`,
      inv.items?.length || 0,
      inv.totalAmount || 0,
      inv.amountPaid || 0,
      inv.amountDue || 0,
      `"${inv.paymentStatus || ''}"`,
      `"${inv.paymentMode || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SalesReport_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report exported to CSV!');
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="reports" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              Sales &amp; Revenue Reports
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Financial performance, tax breakdown, and item analytics
            </p>
          </div>
        </div>

        <button
          onClick={exportToCsv}
          className="btn-cancel"
          style={{ padding: '9px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
        >
          <Icon name="csv" size={16} /> Export CSV
        </button>
      </div>

      {/* Period Selector Tabs & Custom Range */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: period === p.id ? 'var(--gold)' : 'var(--bg-surface)',
                  color: period === p.id ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPeriod('custom');
                }}
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPeriod('custom');
                }}
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <KpiCard
          title="Total Period Sales"
          value={formatCurrency(metrics.totalSales)}
          subtitle={`${metrics.totalCount} invoices generated`}
          icon="trending-up"
          color="primary"
          loading={loading}
        />
        <KpiCard
          title="Total Paid (Collected)"
          value={formatCurrency(metrics.totalPaid)}
          subtitle="Realized revenue"
          icon="check-circle"
          color="success"
          loading={loading}
        />
        <KpiCard
          title="Outstanding Dues"
          value={formatCurrency(metrics.totalDue)}
          subtitle="Pending customer collections"
          icon="alert-circle"
          color="danger"
          loading={loading}
        />
        <KpiCard
          title="Average Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          subtitle="Per invoice average"
          icon="receipt"
          color="purple"
          loading={loading}
        />
      </div>

      {/* Category Breakdown & Performance */}
      {metrics.categoryBreakdown.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="pie-chart" size={18} />
            <span>Revenue Breakdown by Product Category</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {metrics.categoryBreakdown.map(cat => {
              const pct = metrics.totalSales > 0 ? ((cat.amount / metrics.totalSales) * 100).toFixed(1) : 0;
              return (
                <div key={cat.category} style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>{cat.category}</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold)', margin: '4px 0' }}>{formatCurrency(cat.amount)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct}% of period revenue</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices List Table */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="file-text" size={18} />
          <span>Invoices in Period ({invoices.length})</span>
        </h3>

        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>INVOICE #</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>DATE</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>CUSTOMER</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>ITEMS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>TOTAL (₹)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>PAY STATUS</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>MODE</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading reports...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No invoices found for the selected date range.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--gold)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(inv.createdAt)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {inv.customerName}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {inv.items?.length || 0}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className={`badge badge--${inv.paymentStatus === 'FULLY_PAID' ? 'success' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'danger'}`}>
                        {inv.paymentStatus === 'FULLY_PAID' ? 'PAID' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIAL' : 'DUE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {inv.paymentMode || 'CASH'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/invoice/${inv.id}`)}
                        className="btn-cancel"
                        style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
