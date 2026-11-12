import React, { useRef, useState } from 'react';
import SafeImage from '../../ui/SafeImage';
import { FRIENDLY_MOBS } from '../../../constants/gameData';
import { dealMemoryCards } from '../../../domain/memory';
import { playClick, playMatch, playMismatch } from '../../../utils/soundManager';

const REVEAL_DELAY_MS = 300;
const MISMATCH_DELAY_MS = 500;
const WIN_DELAY_MS = 500;

const MemoryGame = ({ pairs, gridCols, cardBack, onWin }) => {
    const [cards] = useState(() => dealMemoryCards(FRIENDLY_MOBS, pairs));
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedFaces, setMatchedFaces] = useState([]);
    const [isChecking, setIsChecking] = useState(false);
    const [mismatchShake, setMismatchShake] = useState(false);
    const mismatchCountRef = useRef(0);

    const checkPair = ([first, second]) => {
        if (cards[first].color === cards[second].color) {
            playMatch();
            const matched = [...matchedFaces, cards[first].color];
            setMatchedFaces(matched);
            setFlippedIndices([]);
            setIsChecking(false);
            if (matched.length === pairs) {
                const perfect = mismatchCountRef.current === 0;
                setTimeout(() => onWin({ perfect }), WIN_DELAY_MS);
            }
            return;
        }
        mismatchCountRef.current += 1;
        playMismatch();
        setMismatchShake(true);
        setTimeout(() => {
            setMismatchShake(false);
            setFlippedIndices([]);
            setIsChecking(false);
        }, MISMATCH_DELAY_MS);
    };

    const flipCard = (index) => {
        if (isChecking || flippedIndices.includes(index) || matchedFaces.includes(cards[index].color)) return;
        const flipped = [...flippedIndices, index];
        setFlippedIndices(flipped);
        playClick();
        if (flipped.length < 2) return;
        setIsChecking(true);
        setTimeout(() => checkPair(flipped), REVEAL_DELAY_MS);
    };

    return (
        <div
            className="flex-1 grid gap-2 bg-black/20 p-2 rounded items-center"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
            {cards.map((card, index) => {
                const isFlipped = flippedIndices.includes(index);
                if (matchedFaces.includes(card.color)) return <div key={card.id} className="w-full aspect-[2/3]"></div>;
                return (
                    <div
                        key={card.id}
                        onClick={() => flipCard(index)}
                        className={`w-full aspect-[2/3] cursor-pointer transition-all duration-300 perspective-1000 relative transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${mismatchShake && isFlipped ? 'animate-shake-flipped border-red-500' : ''}`}
                    >
                        <div
                            className="absolute inset-0 backface-hidden w-full h-full"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <SafeImage
                                src={cardBack}
                                className="w-full h-full object-cover rounded border border-stone-600"
                            />
                        </div>
                        <div
                            className="absolute inset-0 backface-hidden w-full h-full rotate-y-180 bg-slate-800 rounded border border-white/20 flex items-center justify-center"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <SafeImage src={card.img} className="w-full h-full object-contain p-1" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MemoryGame;
