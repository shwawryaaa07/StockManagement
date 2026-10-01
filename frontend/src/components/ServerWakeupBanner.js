import React, { useState, useEffect } from 'react';

function ServerWakeupBanner() {
    const [wakingUp, setWakingUp] = useState(false);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        const handleColdStart = () => {
            setWakingUp(true);
            setCountdown(30);
        };

        const handleReady = () => {
            setWakingUp(false);
        };

        window.addEventListener('backend-cold-start', handleColdStart);
        window.addEventListener('backend-ready', handleReady);

        return () => {
            window.removeEventListener('backend-cold-start', handleColdStart);
            window.removeEventListener('backend-ready', handleReady);
        };
    }, []);

    useEffect(() => {
        let interval = null;
        if (wakingUp) {
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [wakingUp]);

    if (!wakingUp) return null;

    return (
        <div className="server-wakeup-banner no-print" role="status" aria-live="polite">
            <div className="wakeup-spinner"></div>
            <div className="wakeup-content">
                <strong>⚡ Cloud Server Waking Up</strong> — Render backend is spinning up from idle state (~{countdown}s remaining).
                Your data will load automatically!
            </div>
            <button
                type="button"
                className="wakeup-dismiss"
                onClick={() => setWakingUp(false)}
                title="Dismiss notice"
            >
                ✕
            </button>
        </div>
    );
}

export default ServerWakeupBanner;
