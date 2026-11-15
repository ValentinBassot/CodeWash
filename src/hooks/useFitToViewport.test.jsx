import { afterEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { fitZoom, useFitToViewport } from './useFitToViewport';

const resizeTo = (width, height) => {
    window.innerWidth = width;
    window.innerHeight = height;
    act(() => window.dispatchEvent(new Event('resize')));
};

const Probe = () => {
    const { ref, zoom } = useFitToViewport();
    return (
        <div ref={ref} data-testid="probe">
            {zoom}
        </div>
    );
};

const withContentHeight = (height) =>
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => height });

afterEach(() => {
    delete HTMLElement.prototype.offsetHeight;
    resizeTo(1024, 768);
});

describe('fitZoom', () => {
    it('keeps the size when there is room, a safe margin included', () => {
        expect(fitZoom(800, 1280, 1080)).toBe(1);
    });

    it('shrinks so that the content ends above the safe margin', () => {
        expect(fitZoom(1000, 1280, 696)).toBeCloseTo(0.6, 5);
    });

    it('also leaves room for the buttons on top of a phone', () => {
        expect(fitZoom(1000, 390, 760)).toBeCloseTo(0.6, 5);
    });

    it('never goes under the minimum', () => {
        expect(fitZoom(1000, 320, 100)).toBe(0.4);
    });

    it('does nothing when the content is not measured yet', () => {
        expect(fitZoom(0, 320, 100)).toBe(1);
    });
});

describe('useFitToViewport', () => {
    it('zooms out when the window is lower than the content, and follows resizes', () => {
        withContentHeight(1000);
        resizeTo(1280, 696);
        const { getByTestId } = render(<Probe />);
        expect(Number(getByTestId('probe').textContent)).toBeCloseTo(0.6, 5);

        resizeTo(1280, 1200);
        expect(getByTestId('probe').textContent).toBe('1');
    });
});
