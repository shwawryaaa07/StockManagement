import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getInvoices, deleteInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from './SkeletonLoader';
import DeleteModal from './DeleteModal';
import Icon from './Icon';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

export function InvoiceList() {
  usePageTitle('Invoices');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Read initial status filter from URL if present (e.g. ?status=DUE)
  const initialStatus = new URLSearchParams(location.search).get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getInvoices();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDeleteClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedInvoice) {
      try {
        await deleteInvoice(selectedInvoice.id);
        setShowDeleteModal(false);
        toast.success(`Invoice #${selectedInvoice.invoiceNumber} deleted and stock restored.`);
        setSelectedInvoice(null);
        await loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        const message = error?.response?.data?.message || error.message;
        toast.error('Error deleting invoice: ' + message);
      }
    }
  };

  // Calculate metrics
  const totalInvoicesCount = invoices.length;
  const totalBilledAmount = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalDueAmount = invoices.reduce((s, i) => s + (Number(i.amountDue) || 0), 0);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const isPaid = Number(inv.amountDue || 0) <= 0;
    let matchesStatus = true;
    if (statusFilter === 'PAID') matchesStatus = isPaid;
    if (statusFilter === 'DUE') matchesStatus = !isPaid;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.customerContact || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Export to CSV
  const exportToCsv = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No invoices to export.');
      return;
    }

    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal', 'GST Rate', 'GST Amount', 'Total Amount', 'Amount Paid', 'Amount Due', 'Payment Status', 'Payment Mode'];
    const rows = filteredInvoices.map(inv => [
      `"${inv.invoiceNumber || ''}"`,
      `"${formatDate(inv.createdAt)}"`,
      `"${(inv.customerName || '').replace(/"/g, '""')}"`,
      `"${inv.customerContact || ''}"`,
      inv.items?.length || 0,
      inv.subtotal || 0,
      inv.gstRate || 0,
      inv.gstAmount || 0,
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
    link.setAttribute('download', `Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Invoices exported to CSV!');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <TableSkeleton rows={7} cols={6} />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="receipt" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              All Invoices &amp; Bills
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0 0' }}>
              Browse, filter, print, and manage customer billing records
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportToCsv}
            className="btn-cancel"
            style={{ padding: '9px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
          >
            <Icon name="csv" size={15} /> Export CSV
          </button>
          <button
            onClick={() => navigate('/create-invoice')}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <Icon name="plus" size={16} /> New Sale Bill
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Invoices</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalInvoicesCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Sales Billed</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
            {formatCurrency(totalBilledAmount)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Market Dues Pending</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
            {formatCurrency(totalDueAmount)}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, or invoice #..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Bills' },
              { id: 'PAID', label: 'Paid' },
              { id: 'DUE', label: 'Due / Pending' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? 'var(--gold)' : 'var(--bg-surface)',
                  color: statusFilter === tab.id ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>INVOICE #</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>DATE</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>CUSTOMER NAME</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>ITEMS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>TOTAL (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>STATUS</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>MODE</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoices found matching your search.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--gold)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(inv.createdAt)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{inv.customerName}</div>
                      {inv.customerContact && inv.customerContact !== 'N/A' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.customerContact}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge badge--info">{inv.items?.length || 0}</span>
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                          className="btn-cancel"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          View / Print
                        </button>
                        <button
                          onClick={() => handleDeleteClick(inv)}
                          className="btn-cancel"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', color: '#ef4444' }}
                          title="Delete Invoice"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Invoice"
          message={`Are you sure you want to delete Invoice #${selectedInvoice?.invoiceNumber}? Stock quantities will be safely restored.`}
        />
      )}
    </div>
  );
}

export default InvoiceList;
