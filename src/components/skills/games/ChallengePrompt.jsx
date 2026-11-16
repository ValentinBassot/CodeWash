import React, { useEffect, useState } from 'react';
import SafeImage from '../../ui/SafeImage';
import { judgeSpokenWord } from '../../../domain/reading';

const WRONG_FLASH_MS = 500;
const STATUS_TEXTS = ['Listening...', 'Mic Off'];

const WritingImages = ({ images }) => (
    <div className="flex items-center justify-center gap-2">
        {images?.map((img, idx) => (
            <React.Fragment key={idx}>
                {idx > 0 && <span className="text-3xl text-yellow-400 font-bold">+</span>}
                <SafeImage src={img} className="w-24 h-24 object-contain animate-bob" />
            </React.Fragment>
        ))}
    </div>
);

const Word = ({ text }) => (
    <span
        className="text-white font-bold tracking-wider px-2"
        style={{
            fontSize: 'clamp(1rem, 8vw, 2.5rem)',
            maxWidth: '100%',
            wordBreak: 'break-word',
            textAlign: 'center',
            lineHeight: '1.2',
        }}
    >
        {text}
    </span>
);

const ChallengePrompt = ({ type, challenge, spokenText, isSpeechFinal, isListening }) => {
    const [lastJudged, setLastJudged] = useState('');
    const [wrongFlash, setWrongFlash] = useState(false);

    const isNewSpeech =
        type === 'reading' &&
        isSpeechFinal &&
        spokenText &&
        !STATUS_TEXTS.includes(spokenText) &&
        spokenText !== lastJudged;
    if (isNewSpeech) {
        setLastJudged(spokenText);
        if (challenge?.answer && judgeSpokenWord(spokenText, challenge.answer) === 'wrong') setWrongFlash(true);
    }

    useEffect(() => {
        if (!wrongFlash) return undefined;
        const timer = setTimeout(() => setWrongFlash(false), WRONG_FLASH_MS);
        return () => clearTimeout(timer);
    }, [wrongFlash]);

    return (
        <div
            className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full ${wrongFlash ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}
        >
            {type === 'writing' ? (
                <WritingImages images={challenge?.images} />
            ) : (
                <Word text={challenge?.question.replace('Write: ', '') || ''} />
            )}
            {type === 'reading' && (
                <div className={`absolute bottom-1 text-xs ${wrongFlash ? 'text-red-400' : 'text-gray-400'}`}>
                    {spokenText || (isListening ? 'Listening...' : 'Mic Off')}
                </div>
            )}
        </div>
    );
};

export default ChallengePrompt;
