import { useEffect, useRef, useCallback } from 'react';

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivityTimeout(onTimeout, timeoutMs = DEFAULT_TIMEOUT_MS, isEnabled = true) {
    const timerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const onTimeoutRef = useRef(onTimeout);

    // Keep onTimeout callback fresh without triggering listener rebinds
    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (isEnabled) {
            timerRef.current = setTimeout(() => {
                if (onTimeoutRef.current) {
                    onTimeoutRef.current();
                }
            }, timeoutMs);
        }
    }, [isEnabled, timeoutMs]);

    useEffect(() => {
        if (!isEnabled) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // Throttle events to avoid excessive timer resets
        let throttleTimeout = null;
        const handleActivity = () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    throttleTimeout = null;
                    resetTimer();
                }, 1000);
            }
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

        resetTimer();

        return () => {
            events.forEach((evt) => window.removeEventListener(evt, handleActivity));
            if (timerRef.current) clearTimeout(timerRef.current);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, [isEnabled, resetTimer]);
}

export default useInactivityTimeout;
