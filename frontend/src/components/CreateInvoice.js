import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createInvoice } from '../services/api';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';
import ProductSearchBar from './invoice/ProductSearchBar';
import CartItems from './invoice/CartItems';
import PriceSummary from './invoice/PriceSummary';
import usePageTitle from '../utils/usePageTitle';

export function CreateInvoice() {
  usePageTitle('New Tax Invoice');
  const navigate = useNavigate();
  const toast = useToast();

  // Data states
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Invoice Form states
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [items, setItems] = useState([]);
  const [gstRate, setGstRate] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');

  const searchInputRef = useRef(null);
  const handleSubmitRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const prodRes = await getProducts();
      if (prodRes.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
    } catch (error) {
      console.error('Error loading products catalog:', error);
      toast.error('Failed to load product catalog.');
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.modelNumber?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [products, searchTerm]);

  // Add item to bill
  const addItem = (product) => {
    const availableStock = product.quantity !== undefined ? product.quantity : 999;
    const existingIndex = items.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      if (currentQty >= availableStock) {
        toast.warning(`Only ${availableStock} units of "${product.name}" in stock.`);
        return;
      }
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
      toast.info(`Increased "${product.name}" qty to ${updated[existingIndex].quantity}`, 1500);
    } else {
      if (availableStock <= 0) {
        toast.error(`"${product.name}" is OUT OF STOCK!`);
        return;
      }
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          modelNumber: product.modelNumber || '',
          category: product.category || 'General',
          quantity: 1,
          unitPrice: Number(product.price) || 0,
          availableStock: availableStock,
          serialNumber: '',
          warrantyMonths: 12,
          warrantyType: 'Manufacturer',
          warrantyNotes: ''
        }
      ]);
      toast.success(`Added "${product.name}" to bill`, 1800);
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const updateQuantity = (index, delta) => {
    const updated = [...items];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    if (item.availableStock && newQty > item.availableStock) {
      toast.warning(`Only ${item.availableStock} units available.`);
      return;
    }

    item.quantity = newQty;
    setItems(updated);
  };

  const handleDirectQuantityChange = (index, val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) return;
    const updated = [...items];
    const item = updated[index];
    if (item.availableStock && parsed > item.availableStock) {
      toast.warning(`Only ${item.availableStock} units available.`);
      return;
    }
    item.quantity = parsed;
    setItems(updated);
  };

  const removeItem = (index) => {
    const removed = items[index];
    setItems(items.filter((_, i) => i !== index));
    toast.info(`Removed "${removed.productName}" from bill`, 1500);
  };

  const updateItemField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculate Indian GST & Grand Total
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount || 0)));
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = Number(((taxableAmount * Number(gstRate || 0)) / 100).toFixed(2));
  const grandTotal = Number((taxableAmount + gstAmount).toFixed(2));

  const actualPaid = amountPaid === '' ? grandTotal : Number(amountPaid);
  const balanceDue = Math.max(0, Number((grandTotal - actualPaid).toFixed(2)));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!customerName.trim()) {
      toast.warning('Please enter customer name');
      return;
    }

    if (items.length === 0) {
      toast.warning('Please add at least 1 product to the bill');
      return;
    }

    setSubmitting(true);

    const payload = {
      customerName: customerName.trim(),
      customerContact: customerContact.trim() || 'N/A',
      deliveryAddress: deliveryAddress.trim() || 'N/A',
      gstRate: Number(gstRate),
      discount: discount,
      discountAmount: discount,
      paymentMode: paymentMethod,
      amountPaid: actualPaid,
      items: items.map((item) => ({
        product: { id: item.productId },
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        serialNumber: item.serialNumber || '',
        warrantyMonths: item.warrantyMonths !== undefined ? item.warrantyMonths : 12,
        warrantyType: item.warrantyType || 'Manufacturer',
        warrantyNotes: item.warrantyNotes || ''
      }))
    };

    try {
      const res = await createInvoice(payload);
      toast.success('Invoice generated successfully!');
      if (res.data && res.data.id) {
        navigate(`/invoice/${res.data.id}`);
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      const msg = error.response?.data?.message || 'Failed to generate bill. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  // Global hotkeys registration without stale closures
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (handleSubmitRef.current) {
          handleSubmitRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: '1180px', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* Top Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="receipt" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              Create Tax Invoice
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Press <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F4</kbd> to search products &bull; <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '700' }}>F2</kbd> to generate bill
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '360px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-cancel"
            style={{ padding: '10px 18px', fontSize: '13px', flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '13.5px', fontWeight: '800', flex: 1.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Icon name="print" size={16} />
            {submitting ? 'Creating Bill...' : `Create (${items.length} Items)`}
          </button>
        </div>
      </div>

      {/* Customer Information Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '22px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="users" size={18} />
          <span>Customer Details</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Customer Full Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Phone Number (WhatsApp Bill)
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Delivery Address / Location (Optional)
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Products Search & Cart (Left) + Price Summary (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Column: Search & Cart Items */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="boxes" size={18} />
            <span>Select Products &amp; Bill Items</span>
          </h3>

          <ProductSearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchSuggestions={searchSuggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            onSelectItem={addItem}
            searchInputRef={searchInputRef}
            loadingProducts={loadingProducts}
          />

          <CartItems
            items={items}
            updateQuantity={updateQuantity}
            handleDirectQuantityChange={handleDirectQuantityChange}
            removeItem={removeItem}
            updateItemField={updateItemField}
          />
        </div>

        {/* Right Column: Price & Payment Breakdown */}
        <div>
          <PriceSummary
            subtotal={subtotal}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            gstRate={gstRate}
            setGstRate={setGstRate}
            gstAmount={gstAmount}
            grandTotal={grandTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            balanceDue={balanceDue}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateInvoice;
