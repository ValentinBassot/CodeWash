import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CARDS_EACH_SIDE, VISIBLE_EACH_SIDE, getVisibleItems, useCarousel } from './useCarousel';

const ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const ids = (visible) => visible.map((item) => item.id).join('');
const centre = (result) => result.current.visibleItems.find((item) => item.offset === 0).id;
const carousel = (locked = false) =>
    renderHook((props) => useCarousel(props), { initialProps: { items: ITEMS, locked } });

describe('getVisibleItems', () => {
    it('gives thirteen items around the selected one, wrapping at both ends, two of them on each side being shown', () => {
        const visible = getVisibleItems(ITEMS, 0);
        expect(ids(visible)).toBe('cdabcdabcdabc');
        expect(visible.map((item) => item.offset)).toEqual([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]);
        expect(visible.map((item) => item.key)).toEqual([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]);
        expect(CARDS_EACH_SIDE).toBeGreaterThan(VISIBLE_EACH_SIDE);
    });

    it('wraps for any selected index, negative ones included', () => {
        expect(ids(getVisibleItems(ITEMS, 5)).slice(3, 10)).toBe('cdabcda');
        expect(ids(getVisibleItems(ITEMS, -9)).slice(3, 10)).toBe('abcdabc');
    });
});

describe('useCarousel', () => {
    it('starts on the first item', () => {
        expect(centre(carousel().result)).toBe('a');
    });

    it('move goes forward and backward', () => {
        const { result } = carousel();
        act(() => result.current.move(1));
        expect(centre(result)).toBe('b');
        act(() => result.current.move(-2));
        expect(centre(result)).toBe('d');
    });

    it('selecting a side card brings it to the centre, selecting the centre does nothing', () => {
        const { result } = carousel();
        act(() => result.current.selectCard(2));
        expect(centre(result)).toBe('c');
        act(() => result.current.selectCard(0));
        expect(centre(result)).toBe('c');
    });

    it('a drag of 100 pixels to the left shows the next item, once', () => {
        const { result } = carousel();
        act(() => result.current.startDrag(500));
        expect(result.current.isDragging).toBe(true);
        act(() => result.current.drag(401));
        expect(centre(result)).toBe('a');
        act(() => result.current.drag(400));
        expect(centre(result)).toBe('b');
        expect(result.current.isDragging).toBe(false);
        act(() => result.current.drag(200));
        expect(centre(result)).toBe('b');
    });

    it('a drag to the right shows the previous item', () => {
        const { result } = carousel();
        act(() => result.current.startDrag(500));
        act(() => result.current.drag(600));
        expect(centre(result)).toBe('d');
    });

    it('releasing ends the drag without moving', () => {
        const { result } = carousel();
        act(() => result.current.startDrag(500));
        act(() => result.current.endDrag());
        expect(result.current.isDragging).toBe(false);
        act(() => result.current.drag(0));
        expect(centre(result)).toBe('a');
    });

    it('when locked, drags and card selection are ignored', () => {
        const { result, rerender } = carousel(true);
        act(() => result.current.startDrag(500));
        expect(result.current.isDragging).toBe(false);
        act(() => result.current.selectCard(1));
        expect(centre(result)).toBe('a');

        rerender({ items: ITEMS, locked: false });
        act(() => result.current.startDrag(500));
        rerender({ items: ITEMS, locked: true });
        act(() => result.current.drag(0));
        expect(centre(result)).toBe('a');
    });
});
