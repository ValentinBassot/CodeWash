import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { playWith, pressCard, save, skill, typeInto, useGameClock, wait } from './test/game';

const math = () => skill('math');
const startMathBattle = () => pressCard('Calculate!');
const mathInput = () => document.querySelector('input[inputmode="numeric"]');
const currentAnswer = () => {
    const question = screen.getByText(/^\d+ \+ \d+ = \?$/).textContent;
    const [a, b] = question.match(/\d+/g).map(Number);
    return String(a + b);
};
const answerRight = () => typeInto(mathInput(), currentAnswer());
const answerWrong = () => {
    const right = currentAnswer();
    typeInto(mathInput(), right.slice(0, -1) + ((Number(right.at(-1)) + 1) % 10));
    wait(600);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('math battle against a regular mob', () => {
    it('opens a challenge when the card button is pressed', () => {
        render(<App />);
        startMathBattle();
        expect(screen.getByText(/^\d+ \+ \d+ = \?$/)).toBeTruthy();
        expect(mathInput()).toBeTruthy();
    });

    it('one right answer deals 12 damage and gives 20 XP', () => {
        render(<App />);
        startMathBattle();
        answerRight();
        expect(math()).toMatchObject({ level: 1, xp: 20, mobHealth: 48, mobMaxHealth: 60 });
    });

    it('five right answers defeat the mob: level 2, a new full-health mob, stats updated', () => {
        render(<App />);
        startMathBattle();
        const firstMob = math().currentMob;
        for (let hit = 0; hit < 5; hit++) answerRight();

        expect(math()).toMatchObject({ level: 2, xp: 0, mobHealth: 60, mobMaxHealth: 60, difficulty: 1 });
        expect(save().stats).toMatchObject({
            totalMobsDefeated: 1,
            battlesThisSession: 1,
            uniqueMobsDefeated: [firstMob],
        });
    });

    it('each victory counts as one more battle of the session', () => {
        render(<App />);
        startMathBattle();
        for (let hit = 0; hit < 10; hit++) answerRight();

        expect(math().level).toBe(3);
        expect(save().stats).toMatchObject({ totalMobsDefeated: 2, battlesThisSession: 2 });
    });

    it('a wrong answer does not hurt the mob', () => {
        render(<App />);
        startMathBattle();
        answerWrong();
        expect(math()).toMatchObject({ level: 1, xp: 0, mobHealth: 60 });
    });
});

describe('dying', () => {
    it('ten wrong answers kill the player: one death counted, level 1 cannot drop', () => {
        render(<App />);
        startMathBattle();
        for (let miss = 0; miss < 10; miss++) answerWrong();

        expect(save().stats.totalDeaths).toBe(1);
        expect(math()).toMatchObject({ level: 1, lostLevel: false, recoveryDifficulty: 1 });
    });

    it('at level 5, dying costs a level; the next victory only gives it back, its XP stays below the next level', () => {
        playWith((s) => {
            s.skills.math.level = 5;
        });
        startMathBattle();
        for (let miss = 0; miss < 10; miss++) answerWrong();
        expect(math()).toMatchObject({ level: 4, lostLevel: true, recoveryDifficulty: 1 });

        wait(2000);
        startMathBattle();
        for (let hit = 0; hit < 5; hit++) answerRight();
        expect(math()).toMatchObject({ level: 5, xp: 110, lostLevel: false, recoveryDifficulty: null });
    });
});

describe('special encounters', () => {
    it('a miniboss (level 10) falls in one hit and asks difficulty + 1 questions', () => {
        playWith((s) => {
            s.skills.math.level = 10;
        });
        startMathBattle();
        answerRight();

        expect(math().level).toBe(11);
        expect(save().stats).toMatchObject({ totalMinibossesDefeated: 1, totalMobsDefeated: 0 });
    });

    it('a wrong answer against a boss (level 20) heals it to full instead of hurting the player', () => {
        playWith((s) => {
            s.skills.math.level = 20;
        });
        startMathBattle();
        answerRight();
        expect(math().mobHealth).toBe(48);

        answerWrong();
        expect(math().mobHealth).toBe(60);
        expect(save().stats.totalDeaths).toBe(0);
    });

    it('defeating the boss raises the difficulty, awards the first badge and spawns stronger mobs', () => {
        playWith((s) => {
            s.skills.math.level = 20;
        });
        startMathBattle();
        const boss = math().currentBoss;
        for (let hit = 0; hit < 5; hit++) answerRight();

        expect(math()).toMatchObject({
            level: 21,
            difficulty: 2,
            earnedBadges: [1],
            mobHealth: 180,
            mobMaxHealth: 180,
        });
        expect(save().stats).toMatchObject({ totalBossesDefeated: 1, uniqueBossesDefeated: [boss] });
    });
});
