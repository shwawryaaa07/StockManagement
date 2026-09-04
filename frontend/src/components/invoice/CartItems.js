import React from 'react';
import Icon from '../Icon';

const WARRANTY_OPTIONS = [
  { value: 0, label: 'No Warranty' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '1 Year (12M)' },
  { value: 24, label: '2 Years (24M)' },
  { value: 36, label: '3 Years (36M)' },
  { value: 60, label: '5 Years (60M)' }
];

const WARRANTY_TYPES = ['Manufacturer', 'Store Warranty', 'Extended'];

export const CartItems = ({
  items,
  updateQuantity,
  handleDirectQuantityChange,
  removeItem,
  updateItemField
}) => {
  if (items.length === 0) {
    return (
      <div style={{
        padding: '36px 20px',
        textAlign: 'center',
        background: 'var(--bg-body)',
        borderRadius: '12px',
        border: '1px dashed var(--border-color)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <Icon name="boxes" size={36} />
        </div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          No items added to invoice yet
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Search for products above or press <kbd style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>F4</kbd> to add items.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => {
        const itemTotal = Number(item.quantity || 1) * Number(item.unitPrice || 0);

        return (
          <div
            key={item.productId || index}
            style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Top row: Name, Price, Stepper, Total, Remove */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Product Info */}
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>
                  {item.productName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                  {item.modelNumber && <span>Mod: {item.modelNumber}</span>}
                  <span>Unit: ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => updateQuantity(index, -1)}
                  className="btn-cancel"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontWeight: '800' }}
                >
                  -
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={item.availableStock || 999}
                  value={item.quantity}
                  onChange={(e) => handleDirectQuantityChange(index, e.target.value)}
                  style={{
                    width: '44px',
                    height: '32px',
                    textAlign: 'center',
                    fontWeight: '800',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(index, 1)}
                  className="btn-cancel"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontWeight: '800' }}
                >
                  +
                </button>
              </div>

              {/* Line Total */}
              <div style={{ textAlign: 'right', minWidth: '90px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Amount</div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--gold)' }}>
                  ₹{itemTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="btn-cancel"
                style={{ padding: '6px', borderRadius: '6px', color: '#ef4444' }}
                title="Remove item"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>

            {/* Bottom Row: Serial Number & Warranty Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed var(--border-color)'
            }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Serial / IMEI No. (Optional)
                </label>
                <input
                  type="text"
                  value={item.serialNumber || ''}
                  onChange={(e) => updateItemField(index, 'serialNumber', e.target.value)}
                  placeholder="e.g. SN12345678"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <Icon name="warranty" size={12} /> Warranty Period
                </label>
                <select
                  value={item.warrantyMonths ?? 12}
                  onChange={(e) => updateItemField(index, 'warrantyMonths', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                >
                  {WARRANTY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Warranty Coverage Type
                </label>
                <select
                  value={item.warrantyType || 'Manufacturer'}
                  onChange={(e) => updateItemField(index, 'warrantyType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                >
                  {WARRANTY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartItems;
