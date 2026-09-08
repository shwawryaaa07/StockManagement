import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Client-side UPI payment QR Code component (Issue 17)
 * Zero external network calls (eliminates api.qrserver.com privacy & offline risks).
 */
function QRCodeDisplay({
    value,
    size = 210,
    title = 'UPI Payment QR',
    includeCopy = true
}) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleCopy = () => {
        if (!value) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(() => {
                setCopied(true);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => setCopied(false), 2000);
            }).catch(() => {});
        }
    };

    if (!value) {
        return (
            <div style={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '12px'
            }}>
                QR Code Unavailable
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: '12px',
                display: 'inline-block',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
                <QRCodeSVG
                    value={value}
                    size={size}
                    level="M"
                    includeMargin={false}
                    title={title}
                />
            </div>
            {includeCopy && (
                <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                        background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                        color: copied ? '#059669' : '#2563eb',
                        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    {copied ? '✓ UPI Link Copied' : '📋 Copy UPI Link'}
                </button>
            )}
        </div>
    );
}

export default QRCodeDisplay;
