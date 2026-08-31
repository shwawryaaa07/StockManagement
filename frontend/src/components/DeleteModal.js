import React from 'react';

function DeleteModal({ isOpen, onClose, onConfirm, invoiceNumber, title, itemType = 'item' }) {
    if (!isOpen) return null;

    const displayTitle = title || (invoiceNumber 
        ? `Delete ${invoiceNumber}` 
        : `Delete ${itemType}`);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                padding: '32px 36px',
                borderRadius: '20px',
                maxWidth: '440px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-primary, #0f172a)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 16px'
                }}>
                    🗑️
                </div>

                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '900',
                    margin: '0 0 10px 0',
                    color: 'var(--text-primary, #0f172a)'
                }}>
                    {displayTitle}
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '0 0 6px 0',
                    lineHeight: '1.5'
                }}>
                    Are you sure you want to permanently delete {invoiceNumber ? <strong style={{ color: 'var(--text-primary, #0f172a)' }}>"{invoiceNumber}"</strong> : 'this item'}?
                </p>

                <p style={{
                    fontSize: '12px',
                    color: '#ef4444',
                    fontWeight: '700',
                    margin: '0 0 24px 0',
                    background: 'rgba(239, 68, 68, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'inline-block'
                }}>
                    ⚠️ This action cannot be undone!
                </p>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '11px 22px',
                            backgroundColor: 'var(--bg-body, #f1f5f9)',
                            color: 'var(--text-primary, #0f172a)',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        ❌ Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: '11px 24px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        🗑️ Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteModal;
