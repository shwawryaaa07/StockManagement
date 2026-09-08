import React, { useState, useEffect } from 'react';

function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="offline-banner no-print" role="alert" aria-live="assertive">
            <span className="offline-icon">📡</span>
            <span className="offline-text">
                <strong>Offline Mode</strong> — Operating with cached catalog. Invoices will sync when internet restores.
            </span>
        </div>
    );
}

export default OfflineBanner;
