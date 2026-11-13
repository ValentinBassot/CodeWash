import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Mic, Plus, Minus } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import MemoryGame from './games/MemoryGame';
import TypedAnswer from './games/TypedAnswer';
import PatternsGame from './games/PatternsGame';
import MobWithAura from '../ui/MobWithAura';
import ParentalVerificationModal from '../ui/ParentalVerificationModal';
import {
    BASE_ASSETS,
    FRIENDLY_MOBS,
    HOSTILE_MOBS,
    CHEST_BLOCKS,
    BOSS_MOBS,
    MINIBOSS_MOBS,
    DIFFICULTY_IMAGES,
    DIFFICULTY_CONTENT,
} from '../../constants/gameData';
import { judgeSpokenWord } from '../../domain/reading';
import { calculateXPToLevel } from '../../utils/gameUtils';
import { AURA_ADJECTIVES } from '../../utils/mobDisplayUtils';

const PRESTIGE_LEVEL_THRESHOLD = 20;

const SkillCard = ({
    config,
    data,
    themeData,
    isCenter,
    isBattling,
    mobName,
    mobAura,
    challenge,
    isListening,
    spokenText,
    damageNumbers,
    onStartBattle,
    onEndBattle,
    onMathSubmit,
    onMicClick,
    difficulty,
    setDifficulty,
    unlockedDifficulty,
    onPerfectMemoryGame,
    selectedBorder,
    borderColor,
    bossHealing,
}) => {
    const [isHit, setIsHit] = useState(false);
    const [isReadingWrong, setIsReadingWrong] = useState(false);
    const prevDamageCount = useRef(0);
    const readingWordRef = useRef(null);
    const prevSpokenTextRef = useRef('');

    const [showParentalModal, setShowParentalModal] = useState(false);

    // Handler for when parental verification succeeds for Cleaning skill
    const handleParentalVerified = useCallback(() => {
        setShowParentalModal(false);
        onMathSubmit(challenge?.answer);
    }, [onMathSubmit, challenge]);

    // Calculate HP percentage based on mobHealth/mobMaxHealth for HP bar display
    const mobHealth = data.mobHealth || 100;
    const mobMaxHealth = data.mobMaxHealth || 100;
    const hpPercent = Math.round((mobHealth / mobMaxHealth) * 100);

    let borderClass = 'border-stone-500';
    let levelTextColor = 'text-white';
    if (data.level >= 20) {
        levelTextColor = 'text-amber-700';
        borderClass = 'border-wood';
    }
    if (data.level >= 40) {
        levelTextColor = 'text-stone-400';
        borderClass = 'border-stone';
    }
    if (data.level >= 60) {
        levelTextColor = 'text-yellow-400';
        borderClass = 'border-gold';
    }
    if (data.level >= 80) {
        levelTextColor = 'text-gray-200';
        borderClass = 'border-iron';
    }
    if (data.level >= 100) {
        levelTextColor = 'text-emerald-400';
        borderClass = 'border-emerald';
    }
    if (data.level >= 120) {
        levelTextColor = 'text-cyan-300';
        borderClass = 'border-diamond';
    }
    if (data.level >= 140) {
        levelTextColor = 'text-gray-500';
        borderClass = 'border-netherite';
    }
    if (data.level >= 160) {
        levelTextColor = 'text-rainbow';
        borderClass = 'border-netherite';
    }

    // Apply selected border effect if this is the center card
    let appliedBorderEffect = '';
    let borderStyle = {};
    if (isCenter && selectedBorder) {
        if (selectedBorder === 'solid' || selectedBorder === 'solid-picker') {
            appliedBorderEffect = '';
            // For 'solid', use locked yellow color; for 'solid-picker', use custom color
            const effectiveColor = selectedBorder === 'solid' ? '#FFD700' : borderColor || '#FFD700';
            borderStyle = {
                borderColor: effectiveColor,
                boxShadow: `0 0 20px ${effectiveColor}, 0 0 40px ${effectiveColor}`,
            };
        } else {
            appliedBorderEffect = `border-effect-${selectedBorder}`;
            if (selectedBorder === 'gradient' || selectedBorder === 'sparkle') {
                borderStyle = { '--border-color': borderColor || '#FFD700' };
            }
        }
    }

    const skillThemeConfig = themeData.skills[config.id] || {};
    const skillName = skillThemeConfig.name || config.name;

    // Determine valid mob source and display name based on skill type
    let mobSrc;
    let displayMobName = mobName;

    if (config.id === 'memory') {
        mobSrc = 'assets/skills/farm_icon.png';
    } else if (config.id === 'cleaning') {
        mobSrc = CHEST_BLOCKS[mobName] || themeData.assets.mobs[mobName] || BASE_ASSETS.axolotls.Pink;
    } else if (config.id === 'patterns') {
        // Patterns skill uses hostile mobs like other combat skills
        mobSrc =
            HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeData.assets.mobs[mobName];
        if (!mobSrc) {
            // Fallback to Zombie if the provided name is invalid (should not happen with proper state management)
            displayMobName = 'Zombie';
            mobSrc = HOSTILE_MOBS[displayMobName] || BASE_ASSETS.axolotls.Pink;
        }
    } else {
        // Combat skills (reading, writing, math) - validate mob exists
        // Check hostile mobs, boss mobs, and miniboss mobs
        mobSrc =
            HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeData.assets.mobs[mobName];
        if (!mobSrc) {
            // Fallback to Zombie if the provided name is invalid (should not happen with proper state management)
            displayMobName = 'Zombie';
            mobSrc = HOSTILE_MOBS[displayMobName] || BASE_ASSETS.axolotls.Pink;
        }
    }

    // Add aura adjective to mob name when battling
    const displayMobNameWithAura =
        isBattling && mobAura && AURA_ADJECTIVES[mobAura]
            ? `${AURA_ADJECTIVES[mobAura]} ${displayMobName}`
            : displayMobName;

    // Use dynamic sizing for mobs to fill container
    // No longer need fixed pixel sizes - let the container constrain the size
    const mobSize = '100%';

    const gemStyle = {};

    // Extract button colors from config.colorStyle to match card background
    const getButtonStyle = () => {
        const gradientMatch = config.colorStyle?.background?.match(/#([a-fA-F0-9]{6})/g);
        if (gradientMatch && gradientMatch.length >= 2) {
            const fromColor = gradientMatch[0];
            const toColor = gradientMatch[1];
            // Create a darker shadow color from the 'to' color
            const darkenColor = (hex) => {
                const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
                const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
                const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            };
            const shadowColor = darkenColor(toColor);
            return {
                background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
                boxShadow: `0 6px 0 ${shadowColor}`,
                borderColor: fromColor,
            };
        }
        return {
            background: 'linear-gradient(to bottom, #7e22ce, #581c87)',
            boxShadow: '0 6px 0 #581c87',
            borderColor: '#a855f7',
        };
    };

    const buttonStyle = getButtonStyle();

    // Memory game config based on difficulty
    const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
    const memoryPairs = memoryConfig.pairs || 3;
    const memoryGridCols = memoryConfig.gridCols || 4;

    useEffect(() => {
        if (damageNumbers.length > prevDamageCount.current) {
            setIsHit(true);
            setTimeout(() => setIsHit(false), 400);
        }
        prevDamageCount.current = damageNumbers.length;
    }, [damageNumbers]);

    // Detect wrong reading answer based on spoken text changes
    useEffect(() => {
        if (
            config.challengeType === 'reading' &&
            isBattling &&
            spokenText &&
            spokenText !== 'Listening...' &&
            spokenText !== 'Mic Off'
        ) {
            // Check if spoken text changed
            if (spokenText !== prevSpokenTextRef.current) {
                if (challenge?.answer) {
                    if (judgeSpokenWord(spokenText, challenge.answer) === 'wrong') {
                        // Trigger wrong animation
                        setIsReadingWrong(true);
                        setTimeout(() => setIsReadingWrong(false), 500);
                    }
                }
                prevSpokenTextRef.current = spokenText;
            }
        }
    }, [spokenText, config.challengeType, isBattling, challenge?.answer]);

    const showMob = !isBattling || config.id !== 'memory';
    const topSectionBaseClass =
        config.id === 'memory' && isBattling
            ? 'hidden'
            : 'h-[55%] relative flex items-center justify-center overflow-hidden rounded-t-sm';
    const bottomSectionClass =
        config.id === 'memory' && isBattling
            ? 'h-full bg-[#3a3a3a] p-4 flex flex-col relative rounded-lg'
            : 'flex-1 bg-[#3a3a3a] p-4 flex flex-col relative rounded-b-sm';

    const isBattlingCenter = isBattling && isCenter;

    const cardContent = (
        <div
            className={`bg-[#2b2b2b] border-4 rounded-lg overflow-visible flex flex-col transition-all duration-500 ${isCenter ? `${appliedBorderEffect} ${!appliedBorderEffect ? borderClass : ''}` : 'border-stone-700'} w-[300px] h-[600px] ${!isBattlingCenter ? 'relative' : ''}`}
            style={isCenter ? borderStyle : {}}
        >
            {isCenter && data.level >= PRESTIGE_LEVEL_THRESHOLD && (
                <div className="gem-socket">
                    <div className="gem-stone" style={gemStyle}></div>
                </div>
            )}
            <div className={topSectionBaseClass} style={config.colorStyle}>
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {!isBattling && (
                    <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white border border-white/20 z-20">
                        <div className="text-xs text-gray-400 uppercase">{skillName}</div>
                        <div className="text-lg leading-none">{config.fantasyName}</div>
                    </div>
                )}
                {!isBattling && (
                    <div className="absolute top-2 right-2 z-20">
                        <div
                            className={`bg-black/60 px-3 py-1 rounded border border-white/20 text-3xl font-bold ${levelTextColor}`}
                        >
                            Lvl {data.level}
                        </div>
                    </div>
                )}
                {showMob && (
                    <div className="relative z-10 flex items-center justify-center h-full max-h-[200px] w-full">
                        {/* Use MobWithAura component when aura exists (both battle and carousel states) */}
                        {mobAura ? (
                            <MobWithAura
                                mobSrc={mobSrc}
                                aura={mobAura}
                                displayName={displayMobNameWithAura}
                                size={mobSize}
                                isHit={isHit}
                                bossHealing={bossHealing}
                            />
                        ) : (
                            <SafeImage
                                key={displayMobName}
                                src={mobSrc}
                                alt={displayMobName}
                                className={`
                                    relative z-10
                                    max-w-full max-h-full
                                    object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-transform duration-100 
                                    ${isHit ? 'animate-knockback' : bossHealing ? 'animate-shake' : 'animate-bob'} 
                                    ${bossHealing ? 'brightness-150 hue-rotate-90' : ''}
                                `}
                            />
                        )}
                        {damageNumbers.map((dmg) => (
                            <div
                                key={dmg.id}
                                className="absolute text-5xl font-bold text-red-500 animate-bounce pointer-events-none whitespace-nowrap"
                                style={{
                                    left: `calc(50% + ${dmg.x}px)`,
                                    top: `calc(50% + ${dmg.y}px)`,
                                    textShadow: '2px 2px 0 #000',
                                }}
                            >
                                -{dmg.val}
                            </div>
                        ))}
                    </div>
                )}
                {config.id !== 'memory' && !isBattling && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-full text-white border-2 border-white/30 text-xl font-bold tracking-wide z-10 shadow-lg whitespace-nowrap min-w-max">
                        {displayMobName}
                    </div>
                )}
            </div>
            {(!isBattling || config.id !== 'memory') && (
                <div className="bg-[#1a1a1a] p-2 border-t-4 border-b-4 border-black relative">
                    <div className="flex justify-between text-gray-400 text-xs mb-1 uppercase">
                        <span>HP</span>
                        <span>{hpPercent}%</span>
                    </div>
                    <div className="w-full h-6 bg-[#333] rounded-full overflow-hidden border-2 border-[#555] relative">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200"
                            style={{ width: `${hpPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}
            <div className={bottomSectionClass}>
                {isBattling ? (
                    <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
                        {config.id === 'memory' ? (
                            <MemoryGame
                                pairs={memoryPairs}
                                gridCols={memoryGridCols}
                                cardBack={themeData.assets.cardBack}
                                onWin={({ perfect }) => {
                                    if (perfect) onPerfectMemoryGame();
                                    onMathSubmit('WIN');
                                }}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {config.id === 'patterns' ? (
                                    <PatternsGame difficulty={difficulty} onRoundWon={() => onMathSubmit('WIN')} />
                                ) : (
                                    <>
                                        <div
                                            className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full ${isReadingWrong ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}
                                        >
                                            {config.challengeType === 'writing' ? (
                                                // Display single or multiple item images for writing challenge
                                                <div className="flex items-center justify-center gap-2">
                                                    {challenge?.images?.map((img, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {idx > 0 && (
                                                                <span className="text-3xl text-yellow-400 font-bold">
                                                                    +
                                                                </span>
                                                            )}
                                                            <SafeImage
                                                                src={img}
                                                                className="w-24 h-24 object-contain animate-bob"
                                                            />
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            ) : (
                                                (() => {
                                                    const word = challenge?.question.replace('Write: ', '') || '';
                                                    // Use dynamic sizing that always fits the container
                                                    // Start with a base size and let CSS handle the overflow
                                                    return (
                                                        <span
                                                            ref={readingWordRef}
                                                            className="text-white font-bold tracking-wider px-2"
                                                            style={{
                                                                fontSize: 'clamp(1rem, 8vw, 2.5rem)',
                                                                maxWidth: '100%',
                                                                wordBreak: 'break-word',
                                                                textAlign: 'center',
                                                                lineHeight: '1.2',
                                                            }}
                                                        >
                                                            {word}
                                                        </span>
                                                    );
                                                })()
                                            )}
                                            {config.challengeType === 'reading' && (
                                                <div
                                                    className={`absolute bottom-1 text-xs ${isReadingWrong ? 'text-red-400' : 'text-gray-400'}`}
                                                >
                                                    {spokenText || (isListening ? 'Listening...' : 'Mic Off')}
                                                </div>
                                            )}
                                        </div>
                                        {(config.challengeType === 'math' || config.challengeType === 'writing') && (
                                            <TypedAnswer
                                                kind={config.challengeType}
                                                challenge={challenge}
                                                onRight={onMathSubmit}
                                                onWrong={() => onMathSubmit('WRONG')}
                                            />
                                        )}
                                        {config.challengeType === 'reading' && (
                                            <button
                                                onClick={onMicClick}
                                                className={`w-full text-center p-2 rounded border-2 transition-colors flex items-center justify-center gap-2 ${isListening ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:bg-white/10'}`}
                                            >
                                                {isListening ? (
                                                    <Mic className="inline animate-pulse text-red-500" />
                                                ) : (
                                                    <>
                                                        <Mic className="inline text-gray-500" />
                                                        <span className="text-xs uppercase font-bold text-stone-400">
                                                            Tap to Speak
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {config.challengeType === 'cleaning' && (
                                            <button
                                                onClick={() => setShowParentalModal(true)}
                                                className="w-full bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-4 rounded shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] transition-all"
                                            >
                                                Complete!
                                            </button>
                                        )}
                                        {config.challengeType !== 'cleaning' &&
                                            config.challengeType !== 'writing' &&
                                            config.challengeType !== 'math' && (
                                                <button
                                                    onClick={() => onMathSubmit(challenge?.answer)}
                                                    className="mt-auto text-xs text-gray-500 underline hover:text-white self-center"
                                                >
                                                    Skip / Manual Success
                                                </button>
                                            )}
                                    </>
                                )}
                            </div>
                        )}
                        {/* Current XP indicator - visible during battle */}
                        {(() => {
                            const xpToLevel = calculateXPToLevel(difficulty, data.level);
                            const xpPercent = Math.min(100, (data.xp / xpToLevel) * 100);
                            return (
                                <div className="mt-2 bg-[#1a1a1a] p-2 rounded border border-[#333]">
                                    <div className="flex justify-between text-gray-400 text-xs mb-1 uppercase">
                                        <span>XP</span>
                                        <span>
                                            {data.xp} / {xpToLevel}
                                        </span>
                                    </div>
                                    <div className="w-full h-4 bg-[#333] rounded-full overflow-hidden border border-[#555] relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                                            style={{ width: `${xpPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-gray-400 text-center mb-4 px-2">{config.taskDescription}</p>
                        <button
                            onClick={onStartBattle}
                            style={buttonStyle}
                            className={`w-full text-white text-3xl font-bold py-6 rounded-lg active:shadow-none active:translate-y-[6px] transition-all border-2 uppercase tracking-wider`}
                        >
                            {config.actionName}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (isBattlingCenter) {
        return (
            <>
                {ReactDOM.createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onEndBattle}>
                        <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                            {/* Battle Card - Centered */}
                            <div
                                style={{
                                    transform: 'scale(1.5)',
                                    transformOrigin: 'center center',
                                }}
                            >
                                {cardContent}
                            </div>
                            {/* Battle Info Side Panel - Offset to the right with gap */}
                            {/* Positioning: 50% (center) + 225px (half of scaled card 450px) + 30px (gap) */}
                            {!['memory', 'cleaning'].includes(config.id) && (
                                <div
                                    className="absolute left-[calc(50%+225px+30px)] top-0"
                                    style={{
                                        transform: 'scale(1.5)',
                                        transformOrigin: 'left top',
                                    }}
                                >
                                    <div
                                        className="relative w-[175px] bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-50 border-4 border-amber-800 rounded-lg overflow-hidden"
                                        style={{
                                            boxShadow: '0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(251,191,36,0.3)',
                                        }}
                                    >
                                        {/* Decorative corner accents */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-700"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-700"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-700"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-700"></div>

                                        {/* "WANTED" poster style header */}
                                        <div className="bg-gradient-to-b from-red-700 to-red-800 p-2 border-b-4 border-amber-900 relative">
                                            <div
                                                className="text-yellow-300 text-sm font-black uppercase tracking-wider text-center"
                                                style={{
                                                    textShadow:
                                                        '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                                                }}
                                            >
                                                ⚔ BATTLE ⚔
                                            </div>
                                            {/* Decorative rivets */}
                                            <div className="absolute top-1 left-2 w-2 h-2 bg-amber-900 rounded-full border border-amber-950"></div>
                                            <div className="absolute top-1 right-2 w-2 h-2 bg-amber-900 rounded-full border border-amber-950"></div>
                                        </div>

                                        {/* Info sections with vintage styling */}
                                        <div className="p-2 space-y-1.5">
                                            {/* Enemy Name */}
                                            <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                <div className="text-[8px] text-amber-900 uppercase font-bold tracking-wide">
                                                    Target
                                                </div>
                                                <div className="text-stone-900 font-black text-sm leading-tight">
                                                    {displayMobNameWithAura}
                                                </div>
                                            </div>

                                            {/* Skill and Level in a row */}
                                            <div className="flex gap-1.5">
                                                <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                    <div className="text-[8px] text-amber-900 uppercase font-bold">
                                                        Skill
                                                    </div>
                                                    <div className="text-stone-900 font-bold text-xs leading-tight">
                                                        {skillName}
                                                    </div>
                                                </div>
                                                <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                    <div className="text-[8px] text-amber-900 uppercase font-bold">
                                                        Level
                                                    </div>
                                                    <div
                                                        className={`font-black text-base leading-tight ${levelTextColor}`}
                                                        style={{
                                                            WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                                                            filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))',
                                                        }}
                                                    >
                                                        {data.level}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quest/Task */}
                                            <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                <div className="text-[8px] text-amber-900 uppercase font-bold mb-0.5">
                                                    Quest
                                                </div>
                                                <div className="text-stone-800 text-[10px] leading-snug italic font-medium">
                                                    {config.taskDescription}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom stamp/seal effect */}
                                        <div className="bg-gradient-to-t from-amber-900 to-amber-800 p-1 border-t-4 border-amber-950">
                                            <div className="text-center text-yellow-200 text-[8px] font-bold uppercase tracking-widest">
                                                {config.fantasyName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
                <ParentalVerificationModal
                    isOpen={showParentalModal}
                    onClose={() => setShowParentalModal(false)}
                    onVerified={handleParentalVerified}
                />
            </>
        );
    }

    return (
        <div className="relative">
            {/* Difficulty adjuster positioned above the card - hidden for cleaning skill and until difficulty 2 is unlocked */}
            {(!isBattling || config.id !== 'memory') && config.id !== 'cleaning' && unlockedDifficulty > 1 && (
                <div className="absolute -top-10 left-0 flex items-center gap-2 z-20">
                    <button
                        onClick={() => setDifficulty(Math.max(1, difficulty - 1))}
                        className="bg-stone-700 text-white rounded p-1 border border-stone-500 hover:bg-stone-600"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="relative">
                        <SafeImage
                            src={DIFFICULTY_IMAGES[difficulty] || DIFFICULTY_IMAGES[1]}
                            alt={`Difficulty ${difficulty}`}
                            className="w-8 h-8 object-contain"
                        />
                        {/* Difficulty level number indicator in bottom-right corner */}
                        <span className="absolute -bottom-1 -right-1 bg-black/90 text-yellow-400 text-xs font-bold px-1 rounded border border-yellow-500/50 min-w-[16px] text-center">
                            {difficulty}
                        </span>
                    </div>
                    <button
                        onClick={() => setDifficulty(Math.min(unlockedDifficulty, difficulty + 1))}
                        className="bg-stone-700 text-white rounded p-1 border border-stone-500 hover:bg-stone-600"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}
            {cardContent}
            <ParentalVerificationModal
                isOpen={showParentalModal}
                onClose={() => setShowParentalModal(false)}
                onVerified={handleParentalVerified}
            />
        </div>
    );
};

export default SkillCard;
