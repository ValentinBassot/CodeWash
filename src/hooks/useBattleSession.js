import { useEffect, useRef, useState } from 'react';
import { random } from '../domain/random';
import { judgeSpokenWord } from '../domain/reading';
import {
    PLAYER_MAX_HEALTH,
    afterDeath,
    describeHit,
    getChallengeDifficulty,
    recordDefeat,
    resolveHit,
    resolveMistake,
    withPhantomLevel,
} from '../domain/battle';
import { generateChallenge } from '../domain/challenge';
import { isSpeechRecognitionAvailable } from '../io/speechRecognition';
import { useVoiceListener } from './useVoiceListener';
import { BASE_ASSETS, HOSTILE_MOBS, SKILL_DATA } from '../constants/gameData';
import {
    playClick,
    playDeath,
    playFail,
    playLevelUp,
    playMobDeath,
    playMobHurt,
    playNotification,
    playSuccessfulHit,
} from '../utils/soundManager';

const BOSS_HEALING_ANIMATION_DURATION = 600;
const ACHIEVEMENT_CHECK_DELAY_MS = 100;
const DEATH_OVERLAY_DURATION_MS = 2000;
const LEVEL_RESTORED_DURATION_MS = 2000;
const DAMAGE_NUMBER_DURATION_MS = 800;
const LOOT_BOX_DURATION_MS = 4000;

export const useBattleSession = ({ skills, setSkills, stats, setStats, checkAchievements, startBGM }) => {
    const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH);
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null);
    const [challengeData, setChallengeData] = useState(null);
    const [lootBox, setLootBox] = useState(null);
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [bossHealing, setBossHealing] = useState(null);
    const battlingSkillIdRef = useRef(null);
    const liveRef = useRef({ skills, stats, playerHealth });
    const challengeDataRef = useRef(null);
    const damageIdRef = useRef(0);

    useEffect(() => {
        challengeDataRef.current = challengeData;
    }, [challengeData]);

    useEffect(() => {
        battlingSkillIdRef.current = battlingSkillId;
    }, [battlingSkillId]);

    useEffect(() => {
        liveRef.current = { skills, stats, playerHealth };
    }, [skills, stats, playerHealth]);

    useEffect(() => {
        if (lootBox) setTimeout(() => setLootBox(null), LOOT_BOX_DURATION_MS);
    }, [lootBox]);

    const recordStats = (update, skillsAfter) => {
        const { skills: liveSkills, stats: liveStats } = liveRef.current;
        const statsAfter = update(liveStats);
        liveRef.current = { ...liveRef.current, stats: statsAfter };
        setStats(update);
        setTimeout(
            () => checkAchievements(liveStats, statsAfter, liveSkills, skillsAfter || liveSkills),
            ACHIEVEMENT_CHECK_DELAY_MS,
        );
    };

    const handleMistake = () => {
        const { skills: liveSkills, playerHealth: liveHealth } = liveRef.current;
        const battlingId = battlingSkillIdRef.current;
        const mistake = resolveMistake(battlingId ? liveSkills[battlingId] : null, liveHealth);

        if (mistake.kind === 'bossHeals') {
            setSkills((prev) => ({
                ...prev,
                [battlingId]: { ...prev[battlingId], mobHealth: prev[battlingId].mobMaxHealth },
            }));
            setBossHealing(battlingId);
            setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
            playFail();
            return;
        }

        if (mistake.kind === 'hurt') {
            playFail();
            setPlayerHealth(mistake.playerHealth);
            return;
        }

        playDeath();
        setShowDeathOverlay(true);
        recordStats((current) => ({ ...current, totalDeaths: (current.totalDeaths || 0) + 1 }));
        if (battlingId) {
            setSkills((prev) => ({ ...prev, [battlingId]: afterDeath(prev[battlingId]) }));
        }
        setTimeout(() => {
            setBattlingSkillId(null);
            setShowDeathOverlay(false);
        }, DEATH_OVERLAY_DURATION_MS);
        setPlayerHealth(mistake.playerHealth);
    };

    const showHitFeedback = (skillId, skillState) => {
        const hit = describeHit(skillId, skillState);
        const id = ++damageIdRef.current;
        setDamageNumbers((prev) => [
            ...prev,
            { id, skillId, val: hit.dealt, x: random() * 100 - 50, y: random() * 50 - 25 },
        ]);
        setTimeout(() => setDamageNumbers((prev) => prev.filter((n) => n.id !== id)), DAMAGE_NUMBER_DURATION_MS);
        if (hit.defeatsMob) {
            playMobDeath(skillState.currentMob);
        } else {
            playMobHurt(skillState.currentMob);
        }
        playSuccessfulHit();
    };

    const handleSuccessHit = (skillId, isWrong) => {
        if (isWrong === 'WRONG') {
            handleMistake();
            return;
        }
        const { skills: liveSkills } = liveRef.current;
        if (!skillId) return;
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        const currentSkillState = liveSkills[skillId];
        const skillDifficulty = currentSkillState.difficulty || 1;

        if (skillConfig.id !== 'memory') showHitFeedback(skillId, currentSkillState);

        const { skill: nextSkill, events } = resolveHit(skillId, currentSkillState);
        setSkills((prev) => ({ ...prev, [skillId]: nextSkill }));

        if (events.defeated) {
            recordStats((current) => recordDefeat(current, events.defeated), {
                ...liveSkills,
                [skillId]: nextSkill,
            });
        }
        if (events.levelRestored) {
            setShowLevelRestored(true);
            setTimeout(() => setShowLevelRestored(false), LEVEL_RESTORED_DURATION_MS);
            playNotification();
        }
        events.newBadgeLevels.forEach((level) => {
            setLootBox({
                level,
                skillName: skillConfig.fantasyName,
                item: 'New Rank!',
                img: BASE_ASSETS.badges.Wood,
            });
            playNotification();
        });
        if (events.leveledUp) playLevelUp();

        if (skillConfig.hasChallenge && skillConfig.id !== 'memory') {
            const challengeDiff = battleDifficulty || skillDifficulty;
            setChallengeData(generateChallenge(skillConfig.challengeType, challengeDiff));
            if (skillConfig.challengeType === 'reading') voice.clearSpokenText();
        } else if (skillConfig.id === 'memory') {
            setBattlingSkillId(null);
            setBattleDifficulty(null);
        }
    };

    const voice = useVoiceListener({
        keepListening: () => battlingSkillIdRef.current === 'reading',
        onHeard: (text, targetId) => {
            const currentChallenge = challengeDataRef.current;
            if (!currentChallenge || currentChallenge.type !== 'reading') return;
            const verdict = judgeSpokenWord(text, currentChallenge.answer);
            if (verdict === 'correct') handleSuccessHit(targetId || battlingSkillId);
            if (verdict === 'wrong') handleSuccessHit(targetId || battlingSkillId, 'WRONG');
        },
    });

    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;
        playLevelUp();
        setSkills((prev) => ({ ...prev, [skillId]: withPhantomLevel(prev[skillId]) }));
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        if (skillConfig) {
            setLootBox({
                level: skills[skillId].level + 1,
                skillName: skillConfig.fantasyName,
                item: 'Phantom Bonus!',
                img: HOSTILE_MOBS['Phantom'],
            });
            playNotification();
        }
    };

    const startBattle = (id) => {
        const skill = SKILL_DATA.find((s) => s.id === id);
        setBattlingSkillId(id);
        const challengeDiff = getChallengeDifficulty(skills[id]);
        setBattleDifficulty(challengeDiff);
        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM();
        if (skill.challengeType === 'reading' && isSpeechRecognitionAvailable()) voice.start(id);
    };

    const endBattle = () => {
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        voice.stop();
        playClick();
    };

    return {
        playerHealth,
        battlingSkillId,
        challengeData,
        lootBox,
        damageNumbers,
        showDeathOverlay,
        showLevelRestored,
        bossHealing,
        voice,
        recordStats,
        handleSuccessHit,
        handlePhantomLevelAward,
        startBattle,
        endBattle,
    };
};
