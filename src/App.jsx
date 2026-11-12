import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Sparkles, Gift, Maximize, Minimize, Settings, Bug } from 'lucide-react';
import { random } from './domain/random';
import { todayKey } from './domain/clock';
import { judgeSpokenWord } from './domain/reading';
import { describeHit, getAuraForSkill, recordDefeat, resolveHit, withDifficulty } from './domain/battle';
import { generateChallenge } from './domain/challenge';
import { isSpeechRecognitionAvailable } from './io/speechRecognition';
import { useVoiceListener } from './hooks/useVoiceListener';
import { useCarousel } from './hooks/useCarousel';
import { summarizeSavedProfile } from './persistence/profiles';
import { useProfiles } from './hooks/useProfiles';
import { grantParentPrivileges } from './domain/parent';

// Modules
import GlobalStyles from './components/ui/GlobalStyles';
import SafeImage from './components/ui/SafeImage';
import PixelHeart from './components/ui/PixelHeart';
import { browserStorage } from './persistence/profileStorage';
import { summarizeSkills } from './persistence/profileSave';
import ResetModal from './components/modals/ResetModal';
import BugReportModal from './components/modals/BugReportModal';
import SettingsDrawer from './components/drawers/SettingsDrawer';
import CosmeticsDrawer from './components/drawers/CosmeticsDrawer';
import MenuDrawer from './components/drawers/MenuDrawer';
import SkillCard from './components/skills/SkillCard';
import PhantomEvent from './components/PhantomEvent';
import AchievementToast from './components/ui/AchievementToast';

// Utils & Constants
import { getMobForSkill, getEncounterType } from './utils/gameUtils';
import {
    BASE_ASSETS,
    THEME_CONFIG,
    SKILL_DATA,
    DIFFICULTY_CONTENT,
    HOSTILE_MOBS,
    BOSS_MOBS,
    MINIBOSS_MOBS,
} from './constants/gameData';
import {
    getBGMManager,
    setSfxVolume,
    playClick,
    playDeath,
    playFail,
    playLevelUp,
    playNotification,
    playSuccessfulHit,
    playMobHurt,
    playMobDeath,
    playAchievement,
} from './utils/soundManager';
import { getNewlyUnlockedAchievements, getNewTierAchievements, isAchievementUnlocked } from './utils/achievementUtils';

// Parent verification privilege constants

// Voice recognition constants

// Boss healing animation duration (ms)
const BOSS_HEALING_ANIMATION_DURATION = 600;

const App = () => {
    const profiles = useProfiles();
    const {
        currentProfile,
        profileNames,
        parentStatus,
        skills,
        setSkills,
        stats,
        setStats,
        activeTheme,
        setActiveTheme,
        selectedBorder,
        setSelectedBorder,
        borderColor,
        setBorderColor,
    } = profiles;
    const [playerHealth, setPlayerHealth] = useState(10);

    const getProfileStats = (id, liveSkills = null) => {
        // Use live skills if provided (for current profile with pending state changes)
        if (liveSkills) {
            return { ...summarizeSkills(liveSkills), skills: liveSkills, theme: activeTheme };
        }

        return summarizeSavedProfile(browserStorage, id);
    };

    const [achievementToast, setAchievementToast] = useState(null);
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null); // Track battle's starting difficulty for consistent challenge generation
    const [challengeData, setChallengeData] = useState(null);
    const [lootBox, setLootBox] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isBugReportOpen, setIsBugReportOpen] = useState(false);
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bossHealing, setBossHealing] = useState(null); // skillId of boss being healed
    const battlingSkillIdRef = useRef(null);
    const liveRef = useRef({ skills, stats, playerHealth });
    const challengeDataRef = useRef(null);
    const damageIdRef = useRef(0); // Counter for generating unique damage number IDs
    const loginTrackedRef = useRef(false); // Track if we've already recorded today's login
    const [bgmVol, setBgmVol] = useState(0.3);
    const [sfxVol, setSfxVolState] = useState(0.5);
    const bgmManager = useRef(getBGMManager());

    // Calculate unlocked borders based on earned badges (memoized)
    const unlockedBorders = React.useMemo(() => {
        const unlockedBadges = new Set();
        // Tier to badge name mapping
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];

        Object.values(skills).forEach((skill) => {
            if (skill.earnedBadges && Array.isArray(skill.earnedBadges)) {
                skill.earnedBadges.forEach((tier) => {
                    // Convert tier number to badge name (tier 1 = Wood = index 0)
                    if (tier >= 1 && tier <= 8) {
                        unlockedBadges.add(tierToBadge[tier - 1]);
                    }
                });
            }
            // Check for Star badge (level 180+) - this is awarded separately
            if (skill.level >= 180) {
                unlockedBadges.add('Star');
            }
        });
        return Array.from(unlockedBadges);
    }, [skills]);

    // Calculate unlocked achievements (memoized)
    const unlockedAchievements = React.useMemo(() => {
        const unlocked = [];
        const achievementIds = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];

        achievementIds.forEach((id) => {
            if (isAchievementUnlocked(id, stats, skills)) {
                unlocked.push(id);
            }
        });

        return unlocked;
    }, [stats, skills]);

    // Update BGM volume
    useEffect(() => {
        bgmManager.current.setVolume(bgmVol);
    }, [bgmVol]);

    // Update SFX volume in sound manager
    useEffect(() => {
        setSfxVolume(sfxVol);
    }, [sfxVol]);

    // Keep challengeDataRef in sync with challengeData state for voice listener
    useEffect(() => {
        challengeDataRef.current = challengeData;
    }, [challengeData]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Start BGM on first user interaction
    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) {
            bgmManager.current.play();
        }
    }, []);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
        playClick();
    };

    // Regenerate challenge when difficulty or level changes during active battle
    // This fixes the issue where challenges use stale difficulty after leveling up
    // Removed problematic useEffect that was causing infinite loop
    // The startBattle function already sets battleDifficulty correctly

    // Check for achievement unlocks
    const checkAchievements = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        // Check for newly unlocked one-time achievements
        const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);

        // Check for tiered achievement progress
        const newTiers = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);

        // Show toast for the first achievement/tier unlocked
        if (newlyUnlocked.length > 0) {
            // Show first newly unlocked achievement
            setAchievementToast({ achievementId: newlyUnlocked[0], tierIndex: null });
            playAchievement();
        } else if (newTiers.length > 0) {
            // Show first new tier
            setAchievementToast({
                achievementId: newTiers[0].achievementId,
                tierIndex: newTiers[0].tierIndex,
            });
            playAchievement();
        }
    }, []);

    const handleSuccessHit = (skillId, isWrong) => {
        const { skills, stats, playerHealth } = liveRef.current;
        const battlingSkillId = battlingSkillIdRef.current;
        // Handle wrong answer
        if (isWrong === 'WRONG') {
            // Check if player is fighting a boss
            if (battlingSkillId) {
                const currentSkillState = skills[battlingSkillId];
                const encounterType = getEncounterType(currentSkillState.level);

                // Boss fights: heal the boss instead of damaging the player
                if (encounterType === 'boss') {
                    setSkills((prev) => {
                        const current = prev[battlingSkillId];
                        return {
                            ...prev,
                            [battlingSkillId]: {
                                ...current,
                                mobHealth: current.mobMaxHealth, // Fully heal the boss
                            },
                        };
                    });

                    // Trigger boss healing animation
                    setBossHealing(battlingSkillId);
                    setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);

                    // Play fail sound to indicate mistake
                    playFail();
                    return;
                }
            }

            const remainingHealth = playerHealth - 1;
            if (remainingHealth > 0) {
                playFail();
                setPlayerHealth(remainingHealth);
                return;
            }

            playDeath();
            setShowDeathOverlay(true);
            const statsAfterDeath = { ...stats, totalDeaths: (stats.totalDeaths || 0) + 1 };
            setStats((prevStats) => ({ ...prevStats, totalDeaths: (prevStats.totalDeaths || 0) + 1 }));
            setTimeout(() => checkAchievements(stats, statsAfterDeath, skills, skills), 100);

            if (battlingSkillId) {
                setSkills((prev) => {
                    const current = prev[battlingSkillId];
                    return {
                        ...prev,
                        [battlingSkillId]: {
                            ...current,
                            level: Math.max(1, current.level - 1),
                            lostLevel: current.level > 1,
                            recoveryDifficulty: Math.max(1, (current.difficulty || 1) - 1),
                        },
                    };
                });
            }

            setTimeout(() => {
                setBattlingSkillId(null);
                setShowDeathOverlay(false);
            }, 2000);
            setPlayerHealth(10);
            return;
        }

        if (!skillId) return;
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        const currentSkillState = skills[skillId];
        const skillDifficulty = currentSkillState.difficulty || 1;
        const currentMobName = currentSkillState.currentMob;
        const hit = describeHit(skillId, currentSkillState);

        if (skillConfig.id !== 'memory') {
            const id = ++damageIdRef.current;
            setDamageNumbers((prev) => [
                ...prev,
                { id, skillId, val: hit.dealt, x: random() * 100 - 50, y: random() * 50 - 25 },
            ]);
            setTimeout(() => setDamageNumbers((prev) => prev.filter((n) => n.id !== id)), 800);

            if (hit.defeatsMob) {
                playMobDeath(currentMobName);
            } else {
                playMobHurt(currentMobName);
            }

            playSuccessfulHit();
        }

        const { skill: nextSkill, events } = resolveHit(skillId, currentSkillState);
        setSkills((prev) => ({ ...prev, [skillId]: nextSkill }));

        if (events.defeated) {
            const statsAfterDefeat = recordDefeat(stats, events.defeated);
            setStats((prevStats) => recordDefeat(prevStats, events.defeated));
            setTimeout(() => {
                checkAchievements(stats, statsAfterDefeat, skills, { ...skills, [skillId]: nextSkill });
            }, 100);
        }
        if (events.levelRestored) {
            setShowLevelRestored(true);
            setTimeout(() => setShowLevelRestored(false), 2000);
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

        // Generate next challenge for continuous gameplay
        if (skillConfig.hasChallenge && skillConfig.id !== 'memory') {
            // Use the stored battle difficulty for consistent challenge generation throughout the battle
            // This ensures bosses don't change difficulty mid-fight and miniboss difficulty+1 is maintained
            const challengeDiff = battleDifficulty || skillDifficulty;
            setChallengeData(generateChallenge(skillConfig.challengeType, challengeDiff));
            // Clear spokenText for reading challenges to prevent stale text from triggering false damage
            if (skillConfig.challengeType === 'reading') {
                voice.clearSpokenText();
            }
        } else if (skillConfig.id === 'memory') {
            setBattlingSkillId(null);
            setBattleDifficulty(null);
        }
    };

    // Helper function to set difficulty for a specific skill
    const setSkillDifficulty = (skillId, newDiff) => {
        setSkills((prev) => ({ ...prev, [skillId]: withDifficulty(prev[skillId], newDiff) }));
    };

    // Wrapper for setActiveTheme to track theme changes
    const handleThemeChange = useCallback(
        (newTheme) => {
            if (newTheme !== activeTheme) {
                setActiveTheme(newTheme);
                setStats((prevStats) => {
                    const newStats = {
                        ...prevStats,
                        themeChanges: (prevStats.themeChanges || 0) + 1,
                    };

                    // Check achievements
                    setTimeout(() => {
                        checkAchievements(prevStats, newStats, skills, skills);
                    }, 100);

                    return newStats;
                });
            }
        },
        [activeTheme, skills, checkAchievements, setActiveTheme, setStats],
    );

    // Wrapper for setSelectedBorder to track border changes
    const handleBorderChange = useCallback(
        (newBorder) => {
            if (newBorder !== selectedBorder) {
                setSelectedBorder(newBorder);
                setStats((prevStats) => {
                    const newStats = {
                        ...prevStats,
                        borderChanges: (prevStats.borderChanges || 0) + 1,
                    };

                    // Check achievements
                    setTimeout(() => {
                        checkAchievements(prevStats, newStats, skills, skills);
                    }, 100);

                    return newStats;
                });
            }
        },
        [selectedBorder, skills, checkAchievements, setSelectedBorder, setStats],
    );

    // Award a free level from phantom click
    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;

        // Play level up sound
        playLevelUp();

        setSkills((prev) => {
            const current = prev[skillId];
            return {
                ...prev,
                [skillId]: {
                    ...current,
                    level: current.level + 1,
                },
            };
        });

        // Show celebration notification
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

    useEffect(() => {
        const closeDrawersOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            setIsSettingsOpen(false);
            setIsCosmeticsOpen(false);
            setIsMenuOpen(false);
        };
        document.addEventListener('keydown', closeDrawersOnEscape);
        return () => document.removeEventListener('keydown', closeDrawersOnEscape);
    }, []);

    useEffect(() => {
        battlingSkillIdRef.current = battlingSkillId;
    }, [battlingSkillId]);

    useEffect(() => {
        liveRef.current = { skills, stats, playerHealth };
    }, [skills, stats, playerHealth]);

    const startBattle = (id) => {
        const skill = SKILL_DATA.find((s) => s.id === id);
        setBattlingSkillId(id);
        // Use the skill's current difficulty setting
        const currentDiff = skills[id].difficulty || 1;
        const playerLevel = skills[id].level;

        // For miniboss encounters, use difficulty+1 for content (capped at 7)
        const encounterType = getEncounterType(playerLevel);
        const challengeDiff = encounterType === 'miniboss' ? Math.min(7, currentDiff + 1) : currentDiff;

        // Store the battle's challenge difficulty so it remains consistent throughout the battle
        setBattleDifficulty(challengeDiff);

        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM(); // Start BGM on first battle (user interaction)
        if (skill.challengeType === 'reading' && isSpeechRecognitionAvailable()) voice.start(id);
    };

    const endBattle = () => {
        console.log('[Battle] Ending battle, cleaning up speech recognition');
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        voice.stop();
        playClick();
    };

    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        playClick();
        profiles.switchProfile(newId);
    };
    const handleParentVerified = (profileId, verified) => {
        profiles.setParentVerified(profileId, verified);
        if (!verified || profileId !== currentProfile) return;
        setSkills(grantParentPrivileges);
        setTimeout(() => {
            setSkills((current) => ({ ...current }));
        }, 0);
    };
    const handleReset = () => {
        profiles.resetCurrentProfile();
        window.location.reload();
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
    const { isListening, spokenText } = voice;

    useEffect(() => {
        if (lootBox) setTimeout(() => setLootBox(null), 4000);
    }, [lootBox]);

    // Achievement toast auto-dismiss
    useEffect(() => {
        if (achievementToast) {
            setTimeout(() => setAchievementToast(null), 6000);
        }
    }, [achievementToast]);

    // Track login date (once per day)
    useEffect(() => {
        if (loginTrackedRef.current) return; // Skip if already tracked
        loginTrackedRef.current = true;

        const today = todayKey();
        const currentDates = stats.loginDates || [];
        // Only set if today's date is not already recorded
        if (!currentDates.includes(today)) {
            setStats((prev) => ({
                ...prev,
                loginDates: [...(prev.loginDates || []), today],
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount, guarded by loginTrackedRef

    const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
    const containerStyle = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    const carousel = useCarousel({ items: SKILL_DATA, locked: Boolean(battlingSkillId) });

    return (
        <div
            className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100"
            style={containerStyle}
        >
            <GlobalStyles />
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0"></div>

            {/* Top Left Buttons */}
            {/* Button dimensions: p-3 (12px) + icon(48px) + p-3 (12px) + border-2*2 (4px) = 76px + 8px gap = 84px spacing */}
            <button
                aria-label="Open settings"
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: '24px' }}
            >
                <Settings size={48} className="text-slate-400" />
            </button>
            <button
                aria-label="Open cosmetics"
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
            >
                <Sparkles size={48} className="text-purple-400" />
            </button>

            {/* Player Health Display - Centered */}
            <div
                className="absolute z-40 flex gap-1.5"
                style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
            >
                {Array(10)
                    .fill(0)
                    .map((_, i) => (
                        <PixelHeart key={i} size={48} filled={i < playerHealth} />
                    ))}
            </div>

            {/* Cosmetics drawer overlay - click to close */}
            {isCosmeticsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsCosmeticsOpen(false);
                        playClick();
                    }}
                />
            )}
            <CosmeticsDrawer
                isOpen={isCosmeticsOpen}
                activeTheme={activeTheme}
                setActiveTheme={handleThemeChange}
                selectedBorder={selectedBorder}
                setSelectedBorder={handleBorderChange}
                borderColor={borderColor}
                setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders}
                unlockedAchievements={unlockedAchievements}
            />

            {/* Settings drawer overlay - click to close */}
            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsSettingsOpen(false);
                        playClick();
                    }}
                />
            )}
            <SettingsDrawer
                isOpen={isSettingsOpen}
                onReset={() => setIsResetOpen(true)}
                bgmVol={bgmVol}
                setBgmVol={setBgmVol}
                sfxVol={sfxVol}
                setSfxVol={setSfxVolState}
                currentProfile={currentProfile}
                onSwitchProfile={handleSwitchProfile}
                profileNames={profileNames}
                onRenameProfile={profiles.renameProfile}
                getProfileStats={getProfileStats}
                parentStatus={parentStatus}
                onParentVerified={handleParentVerified}
                currentSkills={skills}
            />
            <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
            <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />

            {/* Top Right Buttons */}
            {/* Button dimensions: p-3 (12px) + icon(48px) + p-3 (12px) + border-2*2 (4px) = 76px + 8px gap = 84px spacing */}
            <button
                onClick={toggleFullscreen}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
                {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
            </button>
            <button
                aria-label="Open achievements"
                onClick={() => {
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsMenuOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: '24px' }}
            >
                <Menu size={48} />
            </button>

            {/* Achievement drawer overlay - click to close */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsMenuOpen(false);
                        playClick();
                    }}
                />
            )}
            <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />

            {/* Bottom Right Bug Report Button */}
            <button
                aria-label="Report a bug"
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(false);
                    setIsBugReportOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ bottom: '24px', right: '24px' }}
            >
                <Bug size={48} className="text-red-400" />
            </button>

            {/* Backdrop overlay when battling - click to exit */}
            {battlingSkillId && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        minWidth: '100vw',
                        minHeight: '100vh',
                    }}
                    onClick={endBattle}
                />
            )}
            <main className="flex-1 relative flex flex-col items-center justify-center w-full">
                <div className="z-10 relative mb-[-30px] md:mb-[-50px] pointer-events-none opacity-90">
                    <SafeImage
                        src={currentThemeData.assets.logo}
                        fallbackSrc="https://placehold.co/800x300/333/FFD700?text=LOGO+PLACEHOLDER&font=monsterrat"
                        alt="Game Logo"
                        className="w-[480px] md:w-[720px] lg:w-[960px] object-contain drop-shadow-2xl"
                    />
                </div>
                <h1
                    className="text-9xl text-yellow-400 tracking-widest uppercase mt-[-20px] mb-[95px] z-20 relative drop-shadow-[4px_4px_0_#000]"
                    style={{ textShadow: '6px 6px 0 #000' }}
                >
                    Level Up!
                </h1>

                {/* Left Chevron - Parenthesis style with gradient fade */}
                <button
                    aria-label="Previous skill"
                    onClick={() => carousel.move(-1)}
                    className="flex absolute left-0 z-30 items-center justify-center h-full"
                    style={{
                        background: 'linear-gradient(to right, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0',
                    }}
                >
                    <svg
                        width="60"
                        height="450"
                        viewBox="0 0 60 450"
                        className="animate-chevron-left"
                        style={{ opacity: 0.8 }}
                    >
                        <path
                            d="M 50 25 Q 15 225 50 425"
                            stroke="rgba(150, 150, 150, 0.9)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                {/* Right Chevron - Parenthesis style with gradient fade */}
                <button
                    aria-label="Next skill"
                    onClick={() => carousel.move(1)}
                    className="flex absolute right-0 z-30 items-center justify-center h-full"
                    style={{
                        background: 'linear-gradient(to left, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0',
                    }}
                >
                    <svg
                        width="60"
                        height="450"
                        viewBox="0 0 60 450"
                        className="animate-chevron-right"
                        style={{ opacity: 0.8 }}
                    >
                        <path
                            d="M 10 25 Q 45 225 10 425"
                            stroke="rgba(150, 150, 150, 0.9)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <div
                    className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
                    style={{ cursor: battlingSkillId ? 'default' : carousel.isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => carousel.startDrag(e.clientX)}
                    onMouseMove={(e) => carousel.drag(e.clientX)}
                    onMouseUp={carousel.endDrag}
                    onMouseLeave={carousel.endDrag}
                    onTouchStart={(e) => carousel.startDrag(e.touches[0].clientX)}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        carousel.drag(e.touches[0].clientX);
                    }}
                    onTouchEnd={carousel.endDrag}
                >
                    {carousel.visibleItems.map((item) => {
                        const isItemBattling = item.offset === 0 && battlingSkillId === item.id;
                        // Calculate curved positioning based on offset
                        const getVerticalOffset = (offset) => {
                            if (offset === 0) return -55; // Center card lowered by 5px (was -60)
                            if (Math.abs(offset) === 1) return -30; // Adjacent cards at intermediate height
                            if (Math.abs(offset) === 2) return 20; // Outer cards at lowest position
                            return 75; // Hidden positions (±3) - off-screen, continuing the parabolic curve
                        };
                        const translateY = getVerticalOffset(item.offset);
                        // Add subtle rotation for 3D effect - negative values warp outward
                        const rotateX =
                            Math.abs(item.offset) === 3
                                ? -12
                                : Math.abs(item.offset) === 2
                                  ? -8
                                  : Math.abs(item.offset) === 1
                                    ? -4
                                    : 0;

                        return (
                            <div
                                key={item.key}
                                className="absolute transition-all duration-500 ease-out"
                                style={{
                                    transform: `translateX(${item.offset * 320}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${item.offset === 0 ? 1.1 : 0.85})`,
                                    opacity:
                                        item.offset === 0
                                            ? 1
                                            : Math.abs(item.offset) === 3
                                              ? 0
                                              : Math.abs(item.offset) === 2
                                                ? 0.3
                                                : 0.6,
                                    zIndex: isItemBattling ? 50 : item.offset === 0 ? 20 : 10 - Math.abs(item.offset),
                                    filter: item.offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
                                    cursor: item.offset !== 0 && !battlingSkillId ? 'pointer' : 'default',
                                    // Smooth entry/exit transitions along the parabola
                                    transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                                }}
                                onClick={() => carousel.selectCard(item.offset)}
                            >
                                <SkillCard
                                    config={item}
                                    data={skills[item.id]}
                                    themeData={currentThemeData}
                                    isCenter={item.offset === 0}
                                    isBattling={item.offset === 0 && battlingSkillId === item.id}
                                    mobName={getMobForSkill(item, skills[item.id])}
                                    mobAura={getAuraForSkill(item.id, skills[item.id])}
                                    challenge={challengeData}
                                    isListening={isListening}
                                    spokenText={spokenText}
                                    damageNumbers={damageNumbers.filter((d) => d.skillId === item.id)}
                                    onStartBattle={() => startBattle(item.id)}
                                    onEndBattle={endBattle}
                                    onMathSubmit={(val) => handleSuccessHit(item.id, val)}
                                    onMicClick={() => voice.toggle(item.id)}
                                    difficulty={skills[item.id].difficulty || 1}
                                    setDifficulty={(newDiff) => setSkillDifficulty(item.id, newDiff)}
                                    unlockedDifficulty={Math.min(7, Math.floor(skills[item.id].level / 20) + 1)}
                                    selectedBorder={selectedBorder}
                                    borderColor={borderColor}
                                    bossHealing={bossHealing === item.id}
                                />
                            </div>
                        );
                    })}
                </div>
            </main>
            {lootBox && (
                <div className="fixed bottom-8 left-1/2 z-50 animate-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2">
                    <div className="bg-black/80 border-4 border-yellow-500 rounded-full p-4 px-12 flex items-center justify-between shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md mx-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-500/20 p-3 rounded-full border-2 border-yellow-400">
                                <Gift size={32} className="text-yellow-300 animate-bounce" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1">
                                    LEVEL {lootBox.level} REACHED!
                                </h2>
                                <p className="text-stone-300 text-sm">{lootBox.skillName}</p>
                            </div>
                        </div>
                        <div className="text-right pl-8 border-l-2 border-stone-600 flex items-center gap-4">
                            <SafeImage src={lootBox.img} alt="Badge" className="w-12 h-12 object-contain" />
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wider">Unlocked</p>
                                <p className="text-2xl text-green-400 font-bold">{lootBox.item}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievement Toast */}
            {achievementToast && (
                <AchievementToast
                    achievementId={achievementToast.achievementId}
                    tierIndex={achievementToast.tierIndex}
                />
            )}

            {/* Death Overlay - Minecraft-style YOU DIED screen */}
            {showDeathOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/60 animate-pulse pointer-events-none">
                    <div className="text-center">
                        <h1
                            className="text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]"
                            style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}
                        >
                            YOU DIED
                        </h1>
                        <p className="text-2xl text-red-300 mt-4">Level -1</p>
                        <p className="text-lg text-stone-400 mt-2">Take a moment to rest...</p>
                    </div>
                </div>
            )}

            {/* Level Restored celebration */}
            {showLevelRestored && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="text-center animate-bounce">
                        <h1
                            className="text-6xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]"
                            style={{ textShadow: '4px 4px 0 #000' }}
                        >
                            LEVEL RESTORED!
                        </h1>
                        <p className="text-2xl text-yellow-400 mt-4">Welcome back, hero!</p>
                    </div>
                </div>
            )}

            {/* Phantom Fly-By Bonus Event */}
            <PhantomEvent
                battlingSkillId={battlingSkillId}
                onAwardLevel={handlePhantomLevelAward}
                onPhantomCaught={() => {
                    setStats((prevStats) => {
                        const newStats = {
                            ...prevStats,
                            phantomsCaught: (prevStats.phantomsCaught || 0) + 1,
                        };

                        // Check achievements
                        setTimeout(() => {
                            checkAchievements(prevStats, newStats, skills, skills);
                        }, 100);

                        return newStats;
                    });
                }}
            />
        </div>
    );
};

export default App;
