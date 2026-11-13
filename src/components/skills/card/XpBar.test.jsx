import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import XpBar from './XpBar';
import { calculateXPToLevel } from '../../../utils/gameUtils';

const fill = () => document.querySelector('.bg-gradient-to-r');

describe('XpBar', () => {
    it('shows the xp over what the next level needs', () => {
        const needed = calculateXPToLevel(1, 1);
        render(<XpBar xp={5} level={1} difficulty={1} />);
        expect(screen.getByText(`5 / ${needed}`)).toBeTruthy();
    });

    it('fills the bar in proportion', () => {
        const needed = calculateXPToLevel(1, 1);
        render(<XpBar xp={needed / 2} level={1} difficulty={1} />);
        expect(fill().style.width).toBe('50%');
    });

    it('never fills past the end', () => {
        const needed = calculateXPToLevel(1, 1);
        render(<XpBar xp={needed * 3} level={1} difficulty={1} />);
        expect(fill().style.width).toBe('100%');
    });
});
