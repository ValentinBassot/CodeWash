import { useEffect, useState } from 'react';

export const IDLE_FALLBACK_MS = 200;
export const IDLE_TIMEOUT_MS = 2000;

export const whenIdle = (callback) => {
    if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
        return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(callback, IDLE_FALLBACK_MS);
    return () => clearTimeout(id);
};

export const useDeferredMount = (isOpen) => {
    const [mounted, setMounted] = useState(false);

    if (isOpen && !mounted) setMounted(true);

    useEffect(() => whenIdle(() => setMounted(true)), []);

    return mounted;
};
