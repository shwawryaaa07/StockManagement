import React, { useRef, useEffect } from 'react';
import Icon from '../Icon';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Products', icon: 'boxes' },
  { id: 'TV', label: 'Smart TVs', icon: 'products' },
  { id: 'REFRIGERATOR', label: 'Refrigerators', icon: 'products' },
  { id: 'AC', label: 'Air Conditioners', icon: 'products' },
  { id: 'WASHING_MACHINE', label: 'Washing Machines', icon: 'products' },
  { id: 'AUDIO', label: 'Audio & Speakers', icon: 'products' },
  { id: 'KITCHEN', label: 'Kitchen Appliances', icon: 'products' },
  { id: 'OTHER', label: 'Other', icon: 'products' }
];

export const ProductSearchBar = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  searchSuggestions,
  showSuggestions,
  setShowSuggestions,
  onSelectItem,
  searchInputRef,
  loadingProducts
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Search Input Box */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '14px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <Icon name="search" size={18} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search products by name, model number, brand (Press F4)..."
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '2px solid var(--border-color)',
              background: 'var(--bg-body)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
              }}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Instant Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            zIndex: 1000,
            marginTop: '6px',
            overflow: 'hidden'
          }}>
            {searchSuggestions.map((p) => {
              const stock = p.quantity !== undefined ? p.quantity : 0;
              const isLowStock = stock <= (p.lowStockThreshold || 2);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectItem(p)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: stock > 0 ? 'pointer' : 'not-allowed',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    opacity: stock <= 0 ? 0.6 : 1,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (stock > 0) e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      {p.modelNumber && <span>Mod: {p.modelNumber}</span>}
                      {p.category && <span>&bull; {p.category}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', color: 'var(--gold)', fontSize: '14px' }}>
                      ₹{(Number(p.price) || 0).toLocaleString('en-IN')}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: stock > 0 ? (isLowStock ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'rgba(239, 68, 68, 0.2)',
                      color: stock > 0 ? (isLowStock ? '#eab308' : '#10b981') : '#ef4444'
                    }}>
                      {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px'
      }}>
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeCategory === cat.id ? 'var(--gold)' : 'var(--bg-surface)',
              color: activeCategory === cat.id ? '#0f172a' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductSearchBar;
