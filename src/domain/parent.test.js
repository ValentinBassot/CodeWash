import { describe, expect, it } from 'vitest';
import { grantParentPrivileges } from './parent';

describe('grantParentPrivileges', () => {
    it('puts every skill at level 200, difficulty 7, with all badges and a full-health mob', () => {
        const skills = {
            math: { level: 3, difficulty: 1, earnedBadges: [], mobHealth: 12, mobMaxHealth: 60, currentMob: 'Zombie' },
            reading: { level: 40, difficulty: 2, earnedBadges: [1], mobHealth: 180, mobMaxHealth: 180 },
        };
        const granted = grantParentPrivileges(skills);
        for (const skill of Object.values(granted)) {
            expect(skill).toMatchObject({
                level: 200,
                difficulty: 7,
                earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8],
                mobHealth: 43740,
                mobMaxHealth: 43740,
            });
        }
        expect(granted.math.currentMob).toBe('Zombie');
        expect(skills.math.level).toBe(3);
    });

    it('gives each skill its own list of badges', () => {
        const granted = grantParentPrivileges({ a: {}, b: {} });
        expect(granted.a.earnedBadges).not.toBe(granted.b.earnedBadges);
    });
});
