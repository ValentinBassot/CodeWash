import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SafeImage from './SafeImage';

describe('SafeImage', () => {
    it('loads the image lazily and decodes it off the main thread', () => {
        render(<SafeImage src="assets/a.png" alt="A" className="x" />);
        const image = screen.getByAltText('A');
        expect(image.getAttribute('loading')).toBe('lazy');
        expect(image.getAttribute('decoding')).toBe('async');
        expect(image.getAttribute('src')).toBe('assets/a.png');
    });

    it('passes the click to the image', () => {
        const onClick = vi.fn();
        render(<SafeImage src="assets/a.png" alt="A" onClick={onClick} />);
        fireEvent.click(screen.getByAltText('A'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('shows a placeholder with the name when the image cannot be loaded, and tries again for a new source', () => {
        const { rerender } = render(<SafeImage src="assets/missing.png" alt="Missing" className="x" />);
        fireEvent.error(screen.getByAltText('Missing'));
        expect(screen.queryByAltText('Missing')).toBeNull();
        expect(screen.getByText('Missing')).toBeTruthy();
        rerender(<SafeImage src="assets/other.png" alt="Missing" className="x" />);
        expect(screen.getByAltText('Missing').getAttribute('src')).toBe('assets/other.png');
    });

    it('shows the placeholder, and passes its click, when there is no source', () => {
        const onClick = vi.fn();
        render(<SafeImage alt="Nothing" className="x" onClick={onClick} />);
        fireEvent.click(screen.getByText('Nothing'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('gives an empty alternative text when none is given', () => {
        const { container } = render(<SafeImage src="assets/a.png" />);
        expect(container.querySelector('img').getAttribute('alt')).toBe('');
    });
});
