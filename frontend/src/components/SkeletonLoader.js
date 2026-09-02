import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
    <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="skeleton skeleton-text" style={{ flex: i === 0 ? 2 : 1, height: '16px', marginBottom: 0 }} />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="skeleton-row">
                {Array.from({ length: cols }).map((_, c) => (
                    <div key={c} className="skeleton skeleton-text" style={{ flex: c === 0 ? 2 : 1, height: '14px', marginBottom: 0 }} />
                ))}
            </div>
        ))}
    </div>
);

export const CardSkeleton = ({ count = 4 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', width: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px' }} />
                <div className="skeleton skeleton-title" style={{ width: '70%', height: '28px', margin: '4px 0' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: '12px' }} />
            </div>
        ))}
    </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
    <div className="product-touch-grid">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="product-touch-card" style={{ height: '140px', gap: '10px' }}>
                <div className="skeleton skeleton-text" style={{ width: '35%', height: '10px' }} />
                <div className="skeleton skeleton-text" style={{ width: '85%', height: '18px' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: '16px', marginTop: 'auto' }} />
            </div>
        ))}
    </div>
);

export const InvoiceDetailSkeleton = () => (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton skeleton-title" style={{ width: '220px', height: '32px' }} />
            <div className="skeleton" style={{ width: '100px', height: '28px', borderRadius: '9999px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="skeleton-card" style={{ height: '110px' }} />
            <div className="skeleton-card" style={{ height: '110px' }} />
        </div>
        <TableSkeleton rows={4} cols={4} />
        <div style={{ alignSelf: 'flex-end', width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton skeleton-text" style={{ height: '16px' }} />
            <div className="skeleton skeleton-text" style={{ height: '16px' }} />
            <div className="skeleton skeleton-title" style={{ height: '28px' }} />
        </div>
    </div>
);
