import React, { useEffect, useRef, useState } from 'react';
import { normalizeNumber, normalizeSpelling, withoutSpaces } from '../../../domain/answers';
import { playMismatch } from '../../../utils/soundManager';

const WRONG_DELAY_MS = 500;
const REFOCUS_DELAY_MS = 10;

const KINDS = {
    math: {
        label: 'Your answer',
        normalize: normalizeNumber,
        expected: (answer) => String(answer),
        inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
    },
    writing: {
        label: 'Your spelling',
        normalize: normalizeSpelling,
        expected: (answer) => withoutSpaces(answer),
        inputProps: {},
    },
};

const MathBoxes = ({ answer, typed, isWrong }) => (
    <div className={`flex gap-2 ${isWrong ? 'animate-shake' : ''}`}>
        {String(answer)
            .split('')
            .map((char, i) => (
                <div
                    key={i}
                    className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : i < typed.length ? 'border-green-500' : 'border-gray-600'}`}
                >
                    {typed[i] || ''}
                </div>
            ))}
    </div>
);

const WritingBoxes = ({ answer, typed, isWrong }) => {
    const length = withoutSpaces(answer).length;
    return (
        <div className={`flex gap-1 flex-wrap justify-center ${isWrong ? 'animate-shake' : ''}`}>
            {answer.split('').map((char, i) => {
                if (char === ' ') return <div key={i} className={`${length > 6 ? 'w-7' : 'w-10'}`}></div>;
                const typedIndex = withoutSpaces(answer.slice(0, i)).length;
                return (
                    <div
                        key={i}
                        className={`${length > 6 ? 'w-7 h-9 text-lg' : 'w-10 h-12 text-2xl'} border-b-4 flex items-center justify-center font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : typedIndex < typed.length ? 'border-green-500' : 'border-gray-600'}`}
                    >
                        {typed[typedIndex] || ''}
                    </div>
                );
            })}
        </div>
    );
};

const BOXES = { math: MathBoxes, writing: WritingBoxes };

const TypedAnswer = ({ kind, challenge, onRight, onWrong }) => {
    const { label, normalize, expected, inputProps } = KINDS[kind];
    const [typed, setTyped] = useState('');
    const [isWrong, setIsWrong] = useState(false);
    const [seenChallenge, setSeenChallenge] = useState(challenge);
    const inputRef = useRef(null);
    const timersRef = useRef([]);

    useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

    if (seenChallenge !== challenge) {
        setSeenChallenge(challenge);
        setTyped('');
    }

    const later = (callback, delay) => {
        timersRef.current.push(setTimeout(callback, delay));
    };

    const target = expected(challenge?.answer);
    const Boxes = BOXES[kind];

    const type = (event) => {
        const value = normalize(event.target.value);
        setTyped(value);
        if (value === target) {
            onRight(value);
            setTyped('');
        } else if (value.length === target.length) {
            setIsWrong(true);
            playMismatch();
            onWrong();
            later(() => {
                setIsWrong(false);
                setTyped('');
                later(() => inputRef.current?.focus(), REFOCUS_DELAY_MS);
            }, WRONG_DELAY_MS);
        }
    };

    return (
        <div className="relative w-full flex justify-center">
            <input
                ref={inputRef}
                aria-label={label}
                type="text"
                {...inputProps}
                value={typed}
                onChange={type}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
                maxLength={target.length}
                disabled={isWrong}
            />
            <Boxes answer={challenge?.answer} typed={typed} isWrong={isWrong} />
        </div>
    );
};

export default TypedAnswer;
