import { generateMathProblem, getReadingWord, getWordForDifficulty } from '../utils/gameUtils';

const writingChallenge = (difficulty) => {
    const item = getWordForDifficulty(difficulty);
    return {
        type: 'writing',
        question: 'Spell it!',
        answer: item.displayName.toUpperCase(),
        images: [item.image],
        displayName: item.displayName,
    };
};

const readingChallenge = (difficulty) => {
    const word = getReadingWord(difficulty);
    return { type: 'reading', question: word, answer: word };
};

const CHALLENGES = {
    math: generateMathProblem,
    reading: readingChallenge,
    writing: writingChallenge,
    patterns: () => ({ type: 'patterns', question: 'Simon Says!', answer: 'WIN' }),
    memory: () => ({ type: 'memory', question: 'Find Pairs!', answer: 'WIN' }),
};

export const generateChallenge = (type, difficulty) => {
    const create = CHALLENGES[type];
    return create ? create(difficulty) : { type: 'manual', question: 'Task Complete?', answer: 'yes' };
};
