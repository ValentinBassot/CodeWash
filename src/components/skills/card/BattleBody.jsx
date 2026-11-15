import React from 'react';
import MemoryGame from '../games/MemoryGame';
import PatternsGame from '../games/PatternsGame';
import TypedAnswer from '../games/TypedAnswer';
import ChallengePrompt from '../games/ChallengePrompt';
import MicButton from '../games/MicButton';
import CleaningChallenge from '../games/CleaningChallenge';
import XpBar from './XpBar';
import { DIFFICULTY_CONTENT } from '../../../constants/gameData';

const BattleBody = ({
    config,
    data,
    difficulty,
    challenge,
    spokenText,
    isListening,
    cardBack,
    onAnswer,
    onPerfectMemoryGame,
    onMicClick,
}) => {
    const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
    const memoryPairs = memoryConfig.pairs || 3;
    const memoryGridCols = memoryConfig.gridCols || 4;

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
            {config.id === 'memory' ? (
                <MemoryGame
                    pairs={memoryPairs}
                    gridCols={memoryGridCols}
                    cardBack={cardBack}
                    onWin={({ perfect }) => {
                        if (perfect) onPerfectMemoryGame();
                        onAnswer('WIN');
                    }}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    {config.id === 'patterns' ? (
                        <PatternsGame difficulty={difficulty} onRoundWon={() => onAnswer('WIN')} />
                    ) : (
                        <>
                            <ChallengePrompt
                                type={config.challengeType}
                                challenge={challenge}
                                spokenText={spokenText}
                                isListening={isListening}
                            />
                            {(config.challengeType === 'math' || config.challengeType === 'writing') && (
                                <TypedAnswer
                                    kind={config.challengeType}
                                    challenge={challenge}
                                    onRight={onAnswer}
                                    onWrong={() => onAnswer('WRONG')}
                                />
                            )}
                            {config.challengeType === 'reading' && (
                                <MicButton isListening={isListening} onClick={onMicClick} />
                            )}
                            {config.challengeType === 'cleaning' && (
                                <CleaningChallenge onComplete={() => onAnswer(challenge?.answer)} />
                            )}
                            {config.challengeType !== 'cleaning' &&
                                config.challengeType !== 'writing' &&
                                config.challengeType !== 'math' && (
                                    <button
                                        onClick={() => onAnswer(challenge?.answer)}
                                        className="mt-auto text-xs text-gray-500 underline hover:text-white self-center"
                                    >
                                        Skip / Manual Success
                                    </button>
                                )}
                        </>
                    )}
                </div>
            )}
            <XpBar xp={data.xp} level={data.level} difficulty={difficulty} />
        </div>
    );
};

export default BattleBody;
