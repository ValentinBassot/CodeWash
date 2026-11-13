import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SafeImage from '../../ui/SafeImage';
import { BASE_ASSETS, DIFFICULTY_CONTENT } from '../../../constants/gameData';
import { getTempoDelays } from '../../../domain/patterns';
import { random } from '../../../domain/random';
import { playAxolotlNote, playMatch, playMismatch } from '../../../utils/soundManager';

const PatternsGame = ({ difficulty, onRoundWon }) => {
    const [simonSequence, setSimonSequence] = useState([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [completedRounds, setCompletedRounds] = useState(0);
    const [litAxolotl, setLitAxolotl] = useState(null);
    const [simonGameActive, setSimonGameActive] = useState(false);
    const simonSessionStartedRef = useRef(false);

    const patternConfig = DIFFICULTY_CONTENT.patterns[difficulty] || DIFFICULTY_CONTENT.patterns[1];
    const axolotlCount = patternConfig.axolotlCount || 2;
    const shouldResetSequence = patternConfig.resetSequence || false;

    const axolotlColors = useMemo(() => {
        const allAxolotlColors = Object.keys(BASE_ASSETS.axolotls);
        return allAxolotlColors.slice(0, Math.min(axolotlCount, allAxolotlColors.length));
    }, [axolotlCount]);

    const playSequence = useCallback(
        (sequence) => {
            setIsShowingSequence(true);
            setPlayerIndex(0);
            let i = 0;
            const { onDelay, offDelay } = getTempoDelays(completedRounds, difficulty);

            const playNext = () => {
                if (i < sequence.length) {
                    setLitAxolotl(sequence[i]);
                    playAxolotlNote(sequence[i]);
                    setTimeout(() => {
                        setLitAxolotl(null);
                        i++;
                        setTimeout(playNext, offDelay);
                    }, onDelay);
                } else {
                    setIsShowingSequence(false);
                }
            };
            setTimeout(playNext, 500);
        },
        [completedRounds, difficulty],
    );

    const startSimonGame = useCallback(() => {
        const firstColor = axolotlColors[Math.floor(random() * axolotlColors.length)];
        const newSequence = [firstColor];
        setSimonSequence(newSequence);
        setPlayerIndex(0);
        setCompletedRounds(0);
        setSimonGameActive(true);
        playSequence(newSequence);
    }, [axolotlColors, playSequence]);

    const handleAxolotlClick = (color) => {
        if (isShowingSequence || !simonGameActive) return;

        playAxolotlNote(color);

        if (color === simonSequence[playerIndex]) {
            if (playerIndex === simonSequence.length - 1) {
                playMatch();
                const newRounds = completedRounds + 1;
                setCompletedRounds(newRounds);

                setTimeout(() => {
                    onRoundWon();
                }, 300);

                let newSequence;
                if (shouldResetSequence) {
                    newSequence = [];
                    for (let i = 0; i < simonSequence.length + 1; i++) {
                        newSequence.push(axolotlColors[Math.floor(random() * axolotlColors.length)]);
                    }
                } else {
                    const nextColor = axolotlColors[Math.floor(random() * axolotlColors.length)];
                    newSequence = [...simonSequence, nextColor];
                }

                setSimonSequence(newSequence);
                setPlayerIndex(0);
                setTimeout(() => playSequence(newSequence), 800);
            } else {
                setPlayerIndex(playerIndex + 1);
            }
        } else {
            playMismatch();
            setSimonGameActive(false);
        }
    };

    useEffect(() => {
        if (!simonSessionStartedRef.current) {
            simonSessionStartedRef.current = true;
            startSimonGame();
        }
    }, [startSimonGame]);

    return (
        <div className="w-full flex flex-col items-center gap-1">
            <div className="text-white text-lg font-bold py-1">
                Round: {completedRounds}{' '}
                {isShowingSequence && <span className="text-yellow-400 animate-pulse">Watch!</span>}
                {!isShowingSequence && simonGameActive && <span className="text-green-400">Your turn!</span>}
            </div>
            <div className="relative w-[240px] h-[240px]">
                {axolotlColors.map((color, index) => {
                    const anglePerAxolotl = 360 / axolotlColors.length;
                    const angle = (index * anglePerAxolotl - 90) * (Math.PI / 180);
                    const radius = 85;
                    const x = 120 + radius * Math.cos(angle) - 40;
                    const y = 120 + radius * Math.sin(angle) - 40;
                    const isLit = litAxolotl === color;
                    return (
                        <div
                            key={color}
                            onClick={() => handleAxolotlClick(color)}
                            className={`absolute w-[80px] h-[80px] cursor-pointer transition-all duration-200 rounded-full p-1 ${isLit ? 'scale-125 ring-4 ring-yellow-400 brightness-150 z-10' : 'hover:scale-110'} ${isShowingSequence ? 'pointer-events-none' : ''}`}
                            style={{ left: x, top: y }}
                        >
                            <SafeImage
                                src={BASE_ASSETS.axolotls[color]}
                                alt={color}
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/60 px-1 rounded">
                                {color}
                            </span>
                        </div>
                    );
                })}
            </div>
            {!simonGameActive && completedRounds > 0 && (
                <div className="flex flex-col items-center gap-3">
                    <div className="text-red-400 text-lg font-bold animate-pulse">
                        Game Over! Rounds: {completedRounds}
                    </div>
                    <button
                        onClick={startSimonGame}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-3 px-6 rounded shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatternsGame;
