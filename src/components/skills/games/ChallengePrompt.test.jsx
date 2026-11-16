import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import ChallengePrompt from './ChallengePrompt';

const READING = { type: 'reading', question: 'CAT', answer: 'CAT' };
const box = () => document.querySelector('.border-2');
const flashing = () => box().className.includes('animate-shake');
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
const reading = (spokenText, isListening = true, challenge = READING, isSpeechFinal = true) => (
    <ChallengePrompt
        type="reading"
        challenge={challenge}
        spokenText={spokenText}
        isSpeechFinal={isSpeechFinal}
        isListening={isListening}
    />
);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ChallengePrompt for reading', () => {
    it('shows the word to read and what the microphone status is', () => {
        render(reading('', true));
        expect(screen.getByText('CAT')).toBeTruthy();
        expect(screen.getByText('Listening...')).toBeTruthy();
    });

    it('says the microphone is off when nothing was heard and it is not listening', () => {
        render(reading('', false));
        expect(screen.getByText('Mic Off')).toBeTruthy();
    });

    it('shows what was heard', () => {
        render(reading('CAR'));
        expect(screen.getByText('CAR')).toBeTruthy();
    });

    it('a wrong word makes the box flash red for half a second', () => {
        const { rerender } = render(reading(''));
        rerender(reading('DOG'));
        expect(flashing()).toBe(true);
        expect(box().className).toContain('border-red-500');
        wait(499);
        expect(flashing()).toBe(true);
        wait(1);
        expect(flashing()).toBe(false);
    });

    it('the right word, noise and status texts do not flash', () => {
        const { rerender } = render(reading(''));
        for (const heard of ['CAT', 'A', 'Listening...', 'Mic Off']) {
            rerender(reading(heard));
            expect(flashing()).toBe(false);
        }
    });

    it('the same wrong word heard twice in a row flashes once, as before', () => {
        const { rerender } = render(reading(''));
        rerender(reading('DOG'));
        wait(500);
        rerender(reading('Listening...'));
        rerender(reading('DOG'));
        expect(flashing()).toBe(false);
        rerender(reading('COW'));
        expect(flashing()).toBe(true);
    });

    it('does not flash without an answer to compare with', () => {
        const { rerender } = render(reading('', true, { type: 'reading', question: 'CAT' }));
        rerender(reading('DOG', true, { type: 'reading', question: 'CAT' }));
        expect(flashing()).toBe(false);
    });
});

describe('ChallengePrompt for the other games', () => {
    it('shows the question of a math challenge, without the microphone text', () => {
        render(<ChallengePrompt type="math" challenge={{ question: '2 + 2 = ?' }} spokenText="" isListening={false} />);
        expect(screen.getByText('2 + 2 = ?')).toBeTruthy();
        expect(screen.queryByText('Mic Off')).toBeNull();
    });

    it('removes the "Write: " prefix of a question', () => {
        render(<ChallengePrompt type="math" challenge={{ question: 'Write: HELLO' }} spokenText="" />);
        expect(screen.getByText('HELLO')).toBeTruthy();
    });

    it('shows the pictures of a writing challenge with a plus sign between them', () => {
        render(<ChallengePrompt type="writing" challenge={{ images: ['a.png', 'b.png'] }} spokenText="" />);
        expect(document.querySelectorAll('img')).toHaveLength(2);
        expect(screen.getByText('+')).toBeTruthy();
    });

    it('speech never makes a non-reading box flash', () => {
        const challenge = { question: '2 + 2 = ?', answer: '4' };
        const { rerender } = render(<ChallengePrompt type="math" challenge={challenge} spokenText="" />);
        rerender(<ChallengePrompt type="math" challenge={challenge} spokenText="DOG" />);
        expect(flashing()).toBe(false);
    });
});
