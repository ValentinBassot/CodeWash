import React from 'react';
import ReactDOM from 'react-dom';
import SafeImage from '../ui/SafeImage';
import DifficultyPicker from './card/DifficultyPicker';
import BattleInfoPanel from './card/BattleInfoPanel';
import BattleBody from './card/BattleBody';
import MobWithAura from '../ui/MobWithAura';
import { useHitFlash } from '../../hooks/useHitFlash';
import { getLevelStyle, getBorderEffect, getButtonStyle, resolveMob } from './card/cardStyle';
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
    isSpeechFinal,
    damageNumbers,
    onStartBattle,
    onEndBattle,
    onMathSubmit,
    onMicClick,
    speechFallback,
    onTypeWord,
    difficulty,
    setDifficulty,
    unlockedDifficulty,
    onPerfectMemoryGame,
    selectedBorder,
    borderColor,
    bossHealing,
}) => {
    const isHit = useHitFlash(damageNumbers.length);

    // Calculate HP percentage based on mobHealth/mobMaxHealth for HP bar display
    const mobHealth = data.mobHealth || 100;
    const mobMaxHealth = data.mobMaxHealth || 100;
    const hpPercent = Math.round((mobHealth / mobMaxHealth) * 100);

    const { textColor: levelTextColor, borderClass } = getLevelStyle(data.level);

    const { className: appliedBorderEffect, style: effectStyle } = isCenter
        ? getBorderEffect(selectedBorder, borderColor)
        : { className: '', style: {} };
    const borderStyle = effectStyle;

    const skillThemeConfig = themeData.skills[config.id] || {};
    const skillName = skillThemeConfig.name || config.name;

    const { src: mobSrc, name: displayMobName } = resolveMob(
        config.id,
        mobName,
        themeData.assets.mobs,
        themeData.assets.roster,
    );

    // Add aura adjective to mob name when battling
    const displayMobNameWithAura =
        isBattling && mobAura && AURA_ADJECTIVES[mobAura]
            ? `${AURA_ADJECTIVES[mobAura]} ${displayMobName}`
            : displayMobName;

    // Use dynamic sizing for mobs to fill container
    // No longer need fixed pixel sizes - let the container constrain the size
    const mobSize = '100%';

    const gemStyle = {};

    const buttonStyle = getButtonStyle(config.colorStyle);

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
                    <BattleBody
                        config={config}
                        data={data}
                        difficulty={difficulty}
                        challenge={challenge}
                        spokenText={spokenText}
                        isSpeechFinal={isSpeechFinal}
                        isListening={isListening}
                        cardBack={themeData.assets.cardBack}
                        onAnswer={onMathSubmit}
                        onPerfectMemoryGame={onPerfectMemoryGame}
                        onMicClick={onMicClick}
                        speechFallback={speechFallback}
                        onTypeWord={onTypeWord}
                    />
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
                            {!['memory', 'cleaning'].includes(config.id) && (
                                <BattleInfoPanel
                                    targetName={displayMobNameWithAura}
                                    skillName={skillName}
                                    level={data.level}
                                    levelClassName={levelTextColor}
                                    taskDescription={config.taskDescription}
                                    fantasyName={config.fantasyName}
                                />
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
            </>
        );
    }

    return (
        <div className="relative">
            {/* Difficulty adjuster positioned above the card - hidden for cleaning skill and until difficulty 2 is unlocked */}
            {(!isBattling || config.id !== 'memory') && config.id !== 'cleaning' && unlockedDifficulty > 1 && (
                <DifficultyPicker
                    difficulty={difficulty}
                    unlockedDifficulty={unlockedDifficulty}
                    onChange={setDifficulty}
                />
            )}
            {cardContent}
        </div>
    );
};

export default SkillCard;
