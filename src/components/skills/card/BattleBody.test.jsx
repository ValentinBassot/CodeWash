import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BattleBody from './BattleBody';
import { SKILL_DATA } from '../../../constants/gameData';
import { calculateXPToLevel } from '../../../utils/gameUtils';

const configOf = (id) => SKILL_DATA.find((skill) => skill.id === id);

const setup = (id, props = {}) => {
    const handlers = { onAnswer: vi.fn(), onPerfectMemoryGame: vi.fn(), onMicClick: vi.fn() };
    render(
        <BattleBody
            config={configOf(id)}
            data={{ xp: 5, level: 3 }}
            difficulty={1}
            challenge={{ type: configOf(id).challengeType, answer: '42', question: '40 + 2 = ?' }}
            spokenText=""
            isListening={false}
            cardBack="back.png"
            {...handlers}
            {...props}
        />,
    );
    return handlers;
};

describe('BattleBody', () => {
    it('shows the memory game with its pairs for the difficulty', () => {
        setup('memory');
        expect(document.querySelectorAll('div.perspective-1000')).toHaveLength(6);
    });

    it('falls back on the first difficulty for an unknown difficulty', () => {
        setup('memory', { difficulty: 99 });
        expect(document.querySelectorAll('div.perspective-1000')).toHaveLength(6);
    });

    it('shows the patterns game without the manual success button', () => {
        setup('patterns');
        expect(screen.queryByText('Skip / Manual Success')).toBeNull();
        expect(document.querySelector('.animate-in')).not.toBeNull();
    });

    it('shows a numeric input for math and no manual success button', () => {
        setup('math');
        expect(document.querySelector('input[inputmode="numeric"]')).not.toBeNull();
        expect(screen.queryByText('Skip / Manual Success')).toBeNull();
    });

    it('shows the microphone for reading and sends the right answer on a manual success', () => {
        const { onAnswer, onMicClick } = setup('reading');
        fireEvent.click(screen.getByText('Tap to Speak'));
        expect(onMicClick).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Skip / Manual Success'));
        expect(onAnswer).toHaveBeenCalledWith('42');
    });

    it('lets the player type the word for reading only when the speech has no way to work', () => {
        const onTypeWord = vi.fn();
        setup('reading', { speechFallback: true, onTypeWord });
        fireEvent.change(screen.getByLabelText('Type the word'), { target: { value: 'sun' } });
        fireEvent.submit(screen.getByLabelText('Type the word').closest('form'));
        expect(onTypeWord).toHaveBeenCalledWith('sun');
    });

    it('does not show the typing box while the speech works', () => {
        setup('reading', { speechFallback: false });
        expect(screen.queryByLabelText('Type the word')).toBeNull();
    });

    it('shows the Complete! button for cleaning', () => {
        setup('cleaning');
        expect(screen.getByRole('button', { name: 'Complete!' })).toBeTruthy();
        expect(screen.queryByText('Skip / Manual Success')).toBeNull();
    });

    it('shows the experience bar of the skill', () => {
        setup('math');
        expect(screen.getByText('XP')).toBeTruthy();
        expect(screen.getByText(`5 / ${calculateXPToLevel(1, 3)}`)).toBeTruthy();
    });
});
