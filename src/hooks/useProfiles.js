import { useEffect, useState } from 'react';
import { loadProfile } from '../persistence/profiles';
import {
    browserStorage,
    readCurrentProfile,
    readParentStatus,
    readProfileNames,
    resetProfile,
    writeBorder,
    writeProfileSave,
    writeProfiles,
} from '../persistence/profileStorage';

export const useProfiles = (storage = browserStorage) => {
    const [currentProfile, setCurrentProfile] = useState(() => readCurrentProfile(storage));
    const [profileNames, setProfileNames] = useState(() => readProfileNames(storage));
    const [parentStatus, setParentStatus] = useState(() => readParentStatus(storage));
    const [initialProfile] = useState(() => loadProfile(storage, currentProfile));
    const [saveProblem, setSaveProblem] = useState(initialProfile.problem || null);
    const [skills, setSkills] = useState(initialProfile.skills);
    const [activeTheme, setActiveTheme] = useState(initialProfile.theme);
    const [stats, setStats] = useState(initialProfile.stats);
    const [selectedBorder, setSelectedBorder] = useState(initialProfile.border.effect);
    const [borderColor, setBorderColor] = useState(initialProfile.border.color);

    useEffect(() => {
        writeProfileSave(storage, currentProfile, { skills, theme: activeTheme, stats });
        writeProfiles(storage, { currentProfile, profileNames, parentStatus });
    }, [storage, skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    useEffect(() => {
        writeBorder(storage, currentProfile, { effect: selectedBorder, color: borderColor });
    }, [storage, selectedBorder, borderColor, currentProfile]);

    const switchProfile = (profileId) => {
        if (profileId === currentProfile) return;
        const next = loadProfile(storage, profileId);
        setSkills(next.skills);
        setActiveTheme(next.theme);
        setStats(next.stats);
        setSelectedBorder(next.border.effect);
        setBorderColor(next.border.color);
        setSaveProblem(next.problem || null);
        setCurrentProfile(profileId);
    };

    const renameProfile = (profileId, name) => {
        setProfileNames((names) => ({ ...names, [profileId]: name }));
    };

    const setParentVerified = (profileId, verified) => {
        setParentStatus((status) => ({ ...status, [profileId]: verified }));
    };

    return {
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
        saveProblem,
        dismissSaveProblem: () => setSaveProblem(null),
        switchProfile,
        renameProfile,
        setParentVerified,
        resetCurrentProfile: () => resetProfile(storage, currentProfile),
    };
};
