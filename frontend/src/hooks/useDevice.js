import { useState, useEffect } from 'react';

// Defined at module scope so it runs synchronously before first render
function getDeviceType() {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w >= 1024) return 'desktop';
    if (w >= 640) return 'tablet';
    return 'mobile';
}

export function useDevice() {
    // Pass getDeviceType as initializer function — runs synchronously on first render
    // This means the FIRST render already has the correct device type, no flash
    const [device, setDevice] = useState(getDeviceType);

    useEffect(() => {
        let timeoutId;
        const handler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setDevice(getDeviceType());
            }, 150);
        };
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler);
            clearTimeout(timeoutId);
        };
    }, []);

    return {
        device,
        isMobile: device === 'mobile',
        isTablet: device === 'tablet',
        isDesktop: device === 'desktop',
    };
}
