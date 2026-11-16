import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_LENGTH = 2;

export const normalizeSpeech = (transcript) =>
    transcript
        .toUpperCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .trim();

const wordsOf = (spoken) => spoken.split(/\s+/).filter(Boolean);

export const judgeSpokenWord = (spoken, answer) => {
    const accepted = [answer, ...(HOMOPHONES[answer] || [])];
    if (wordsOf(spoken).some((word) => accepted.includes(word))) return 'correct';
    if (spoken.length >= MIN_SPOKEN_LENGTH) return 'wrong';
    return 'noise';
};
