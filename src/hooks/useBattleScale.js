import { useEffect, useState } from 'react';

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 600;
export const MAX_SCALE = 1.5;
export const MARGIN = 16;
export const PANEL_MIN_WIDTH = 1100;
export const HEARTS_SPACE = 72;

export const fitScale = (width, height) =>
    Math.min(MAX_SCALE, (height - 2 * MARGIN - HEARTS_SPACE) / CARD_HEIGHT, (width - 2 * MARGIN) / CARD_WIDTH);

const read = () => ({ width: window.innerWidth, height: window.innerHeight });

export const useBattleScale = () => {
    const [size, setSize] = useState(read);

    useEffect(() => {
        const onResize = () => setSize(read());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return { scale: fitScale(size.width, size.height), showPanel: size.width >= PANEL_MIN_WIDTH };
};
