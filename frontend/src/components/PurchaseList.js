import React, { useState, useEffect, useCallback } from 'react';
import api, { getProducts } from '../services/api';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import usePageTitle from '../utils/usePageTitle';

export const PurchaseList = () => {
  usePageTitle('Stock Purchases (Stock-In)');
  const toast = useToast();

  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', quantity: 1, purchasePrice: '', productName: '', modelNumber: '' }
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [purRes, prodRes] = await Promise.all([
        api.get('/purchases').catch(() => ({ data: [] })),
        getProducts().catch(() => ({ data: [] }))
      ]);

      if (purRes.data && Array.isArray(purRes.data)) {
        setPurchases(purRes.data);
      }
      if (prodRes.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error('Failed to load purchase records.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { productId: '', quantity: 1, purchasePrice: '', productName: '', modelNumber: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;

    if (field === 'productId') {
      const selectedProd = products.find(p => String(p.id) === String(value));
      if (selectedProd) {
        updated[index].productName = selectedProd.name;
        updated[index].modelNumber = selectedProd.modelNumber || '';
        // If price not yet entered, default to current product cost/price
        if (!updated[index].purchasePrice) {
          updated[index].purchasePrice = selectedProd.price || '';
        }
      }
    }

    setPurchaseItems(updated);
  };

  const totalPurchaseAmount = purchaseItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.purchasePrice) || 0;
    return sum + (qty * price);
  }, 0);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      toast.warning('Please enter supplier name.');
      return;
    }

    const validItems = purchaseItems.filter(item => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      toast.warning('Please add at least one product with valid quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
        supplierGstin: supplierGstin.trim(),
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        notes: notes.trim(),
        items: validItems.map(item => ({
          product: { id: Number(item.productId) },
          productName: item.productName,
          modelNumber: item.modelNumber,
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice || 0)
        }))
      };

      const res = await api.post('/purchases', payload);
      toast.success(`Stock In recorded successfully! ID: ${res.data?.purchaseNumber || ''}`);
      setShowAddModal(false);
      // Reset form
      setSupplierName('');
      setSupplierContact('');
      setSupplierGstin('');
      setSupplierInvoiceNumber('');
      setNotes('');
      setPurchaseItems([{ productId: '', quantity: 1, purchasePrice: '', productName: '', modelNumber: '' }]);
      loadData();
    } catch (error) {
      console.error('Error recording purchase:', error);
      const msg = error.response?.data?.message || 'Failed to record stock purchase.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePurchase = async (id, purchaseNumber) => {
    if (window.confirm(`Delete purchase record ${purchaseNumber}? Stock quantities added by this purchase will be reverted.`)) {
      try {
        await api.delete(`/purchases/${id}`);
        toast.success(`Purchase ${purchaseNumber} deleted and stock adjusted.`);
        loadData();
      } catch (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Failed to delete purchase record.');
      }
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="truck" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              Stock Purchases (Stock-In Register)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Track supplier inventory purchases and stock increases
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
        >
          <Icon name="stock-in" size={16} /> Record Stock-In
        </button>
      </div>

      {/* Purchases Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>PURCHASE #</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>DATE</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>SUPPLIER</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>SUPPLIER BILL #</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>ITEMS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>TOTAL COST (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No stock purchase records found. Click "+ Record Stock-In" to add inventory.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--gold)' }}>
                      {pur.purchaseNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(pur.createdAt)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {pur.supplierName}
                      {pur.supplierContact && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pur.supplierContact}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {pur.supplierInvoiceNumber || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge badge--info">{pur.items?.length || 0} items</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {formatCurrency(pur.totalAmount)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="btn-cancel"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeletePurchase(pur.id, pur.purchaseNumber)}
                          className="btn-cancel"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', color: '#ef4444' }}
                          title="Delete purchase and revert stock"
                        >
                          <Icon name="trash" size={13} />
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

      {/* Record Stock-In Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="truck" size={24} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Record Stock-In / New Purchase
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Supplier Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Sony India Pvt Ltd / Distributor"
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Supplier Phone / Contact
                  </label>
                  <input
                    type="tel"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="Supplier contact number"
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Supplier Invoice / Bill No
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="e.g. SUP-9842"
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Purchased Products &amp; Quantities
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="btn-cancel"
                    style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Icon name="plus" size={12} /> Add Item Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {purchaseItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'var(--bg-surface)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="form-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px' }}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.quantity || 0})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="form-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit Cost ₹"
                          value={item.purchasePrice}
                          onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                          className="form-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={purchaseItems.length === 1}
                        className="btn-cancel"
                        style={{ padding: '6px', color: '#ef4444', border: 'none' }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>Total Purchase Cost:</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold)' }}>
                  {formatCurrency(totalPurchaseAmount)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Purchase Notes / Logistics
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received batch from Goa transport depot, paid via NEFT"
                  className="form-input"
                  style={{ width: '100%', minHeight: '50px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                  style={{ flex: 1, padding: '11px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Icon name="check" size={16} />
                  {submitting ? 'Recording...' : 'Save & Increment Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Purchase Details
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '700' }}>
                  {viewingPurchase.purchaseNumber}
                </div>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Supplier:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingPurchase.supplierName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                <span>{formatDate(viewingPurchase.createdAt)}</span>
              </div>
              {viewingPurchase.supplierInvoiceNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Supplier Invoice #:</span>
                  <span>{viewingPurchase.supplierInvoiceNumber}</span>
                </div>
              )}
              {viewingPurchase.notes && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                  <span>{viewingPurchase.notes}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Items Received
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {viewingPurchase.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '12px' }}>
                    <div>
                      <strong>{item.productName}</strong>
                      {item.modelNumber && <span style={{ color: 'var(--text-muted)' }}> ({item.modelNumber})</span>}
                    </div>
                    <div>
                      {item.quantity} units @ {formatCurrency(item.purchasePrice)} = <strong>{formatCurrency(item.totalPrice)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: '700' }}>Total Cost:</span>
              <strong style={{ fontSize: '16px', color: 'var(--gold)' }}>{formatCurrency(viewingPurchase.totalAmount)}</strong>
            </div>

            <button
              onClick={() => setViewingPurchase(null)}
              className="btn-cancel"
              style={{ width: '100%', marginTop: '16px', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
