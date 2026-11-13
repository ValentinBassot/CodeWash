import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DifficultyPicker from './DifficultyPicker';

const press = (index) => fireEvent.click(screen.getAllByRole('button')[index]);

describe('DifficultyPicker', () => {
    it('shows the current difficulty', () => {
        render(<DifficultyPicker difficulty={2} unlockedDifficulty={3} onChange={() => {}} />);
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.getByAltText('Difficulty 2')).toBeTruthy();
    });

    it('lowers and raises the difficulty by one', () => {
        const onChange = vi.fn();
        render(<DifficultyPicker difficulty={2} unlockedDifficulty={4} onChange={onChange} />);
        press(0);
        press(1);
        expect(onChange).toHaveBeenNthCalledWith(1, 1);
        expect(onChange).toHaveBeenNthCalledWith(2, 3);
    });

    it('never goes below 1', () => {
        const onChange = vi.fn();
        render(<DifficultyPicker difficulty={1} unlockedDifficulty={4} onChange={onChange} />);
        press(0);
        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('never goes above the unlocked difficulty', () => {
        const onChange = vi.fn();
        render(<DifficultyPicker difficulty={3} unlockedDifficulty={3} onChange={onChange} />);
        press(1);
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('falls back to the first image for an unknown difficulty', () => {
        render(<DifficultyPicker difficulty={99} unlockedDifficulty={99} onChange={() => {}} />);
        expect(screen.getByAltText('Difficulty 99')).toBeTruthy();
    });
});
