import { useEffect, useState } from 'react';

const HIT_FLASH_MS = 400;

export const useHitFlash = (count) => {
    const [seen, setSeen] = useState(count);
    const [hits, setHits] = useState(0);
    const [flashing, setFlashing] = useState(false);

    if (count !== seen) {
        setSeen(count);
        if (count > seen) {
            setHits(hits + 1);
            setFlashing(true);
        }
    }

    useEffect(() => {
        if (hits === 0) return undefined;
        const timer = setTimeout(() => setFlashing(false), HIT_FLASH_MS);
        return () => clearTimeout(timer);
    }, [hits]);

    return flashing;
};
