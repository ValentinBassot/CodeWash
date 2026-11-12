import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_LENGTH = 2;

export const normalizeSpeech = (transcript) =>
    transcript
        .toUpperCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .trim();

export const judgeSpokenWord = (spoken, answer) => {
    if (spoken === answer || HOMOPHONES[answer]?.includes(spoken)) return 'correct';
    if (spoken.length >= MIN_SPOKEN_LENGTH) return 'wrong';
    return 'noise';
};
