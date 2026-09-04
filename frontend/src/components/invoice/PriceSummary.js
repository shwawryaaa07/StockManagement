import React from 'react';
import Icon from '../Icon';

const GST_RATES = [0, 5, 12, 18, 28];
const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: 'credit-card' },
  { id: 'UPI', label: 'UPI / QR', icon: 'credit-card' },
  { id: 'CARD', label: 'Card', icon: 'credit-card' },
  { id: 'BANK_TRANSFER', label: 'Net Banking', icon: 'credit-card' },
  { id: 'DUE', label: 'Credit / Due', icon: 'credit-card' }
];

export const PriceSummary = ({
  subtotal,
  discountAmount,
  setDiscountAmount,
  gstRate,
  setGstRate,
  gstAmount,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  balanceDue
}) => {
  const taxableAmount = Math.max(0, subtotal - Number(discountAmount || 0));

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      padding: '22px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name="receipt" size={18} />
        <span>Payment &amp; Tax Calculation</span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
          <strong style={{ color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</strong>
        </div>

        {/* Discount Input */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Special Discount (₹):
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={subtotal}
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
            style={{
              width: '120px',
              padding: '6px 10px',
              fontSize: '13px',
              textAlign: 'right',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-body)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Taxable Amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Taxable Amount:</span>
          <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
        </div>

        {/* GST Rate Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            GST Slab Rate
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {GST_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setGstRate(rate)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: gstRate === rate ? 'var(--gold)' : 'var(--bg-body)',
                  color: gstRate === rate ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* Calculated GST */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>GST Amount ({gstRate}%):</span>
          <span style={{ color: 'var(--text-primary)' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
        </div>

        <div style={{ borderBottom: '1px solid var(--border-color)', margin: '4px 0' }}></div>

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Grand Total:</span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)' }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Payment Method
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px' }}>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(pm.id);
                  if (pm.id === 'DUE') {
                    setAmountPaid('0');
                  } else if (amountPaid === '0' || amountPaid === 0) {
                    setAmountPaid('');
                  }
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: paymentMethod === pm.id ? 'var(--primary-color, #3b82f6)' : 'var(--bg-body)',
                  color: paymentMethod === pm.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Paid vs Due */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Amount Paid (₹)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={grandTotal}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={`₹${grandTotal}`}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-body)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Balance Due (₹)
            </label>
            <div style={{
              padding: '8px 10px',
              fontSize: '14px',
              fontWeight: '800',
              borderRadius: '6px',
              background: balanceDue > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: balanceDue > 0 ? '#ef4444' : '#10b981',
              border: '1px solid var(--border-color)'
            }}>
              ₹{balanceDue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;
