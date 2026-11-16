import { useEffect, useRef, useState } from 'react';

export const SAFE_BOTTOM = 96;
export const PHONE_TOP = 64;
export const PHONE_MAX_WIDTH = 767;
export const MIN_ZOOM = 0.4;

export const fitZoom = (contentHeight, viewportWidth, viewportHeight) => {
    if (!contentHeight) return 1;
    const top = viewportWidth <= PHONE_MAX_WIDTH ? PHONE_TOP : 0;
    const zoom = (viewportHeight - SAFE_BOTTOM - top) / contentHeight;
    return Math.max(MIN_ZOOM, Math.min(1, zoom));
};

const readViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export const useFitToViewport = () => {
    const ref = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [viewport, setViewport] = useState(readViewport);

    useEffect(() => {
        const element = ref.current;
        const measure = () => {
            setContentHeight(element.offsetHeight);
            setViewport(readViewport());
        };
        measure();
        window.addEventListener('resize', measure);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        if (observer) observer.observe(element);
        return () => {
            window.removeEventListener('resize', measure);
            if (observer) observer.disconnect();
        };
    }, []);

    return { ref, zoom: fitZoom(contentHeight, viewport.width, viewport.height) };
};
