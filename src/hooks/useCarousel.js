import { useState } from 'react';
import { playActionCardLeft, playActionCardRight } from '../utils/soundManager';

const SWIPE_DISTANCE = 100;
export const VISIBLE_EACH_SIDE = 2;
export const CARDS_EACH_SIDE = 6;

export const getVisibleItems = (items, selectedIndex) => {
    const visible = [];
    for (let offset = -CARDS_EACH_SIDE; offset <= CARDS_EACH_SIDE; offset++) {
        const key = selectedIndex + offset;
        const index = ((key % items.length) + items.length) % items.length;
        visible.push({ ...items[index], offset, key });
    }
    return visible;
};

export const useCarousel = ({ items, locked }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);

    const move = (offset) => {
        setSelectedIndex((index) => index + offset);
        if (offset > 0) {
            playActionCardRight();
        } else {
            playActionCardLeft();
        }
    };

    const startDrag = (clientX) => {
        if (locked) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };

    const drag = (clientX) => {
        if (!isDragging || locked) return;
        const distance = dragStartX - clientX;
        if (Math.abs(distance) < SWIPE_DISTANCE) return;
        move(distance > 0 ? 1 : -1);
        setIsDragging(false);
    };

    const endDrag = () => setIsDragging(false);

    const selectCard = (offset) => {
        if (locked || offset === 0) return;
        move(offset);
    };

    return {
        visibleItems: getVisibleItems(items, selectedIndex),
        isDragging,
        move,
        startDrag,
        drag,
        endDrag,
        selectCard,
    };
};
