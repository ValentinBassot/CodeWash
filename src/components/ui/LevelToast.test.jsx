import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LevelToast from './LevelToast';

describe('LevelToast', () => {
    it('tells the level reached, the skill and what was unlocked', () => {
        render(<LevelToast level={20} skillName="Enchanting Table" item="New Rank!" img="badge.png" />);
        expect(screen.getByText('LEVEL 20 REACHED!')).toBeTruthy();
        expect(screen.getByText('Enchanting Table')).toBeTruthy();
        expect(screen.getByText('New Rank!')).toBeTruthy();
        expect(screen.getByAltText('Badge').getAttribute('src')).toBe('badge.png');
    });

    it('does not position itself: the stack does', () => {
        const { container } = render(<LevelToast level={1} skillName="a" item="b" img="c.png" />);
        expect(container.firstChild.className).not.toContain('fixed');
    });
});
