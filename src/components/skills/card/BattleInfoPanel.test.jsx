import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BattleInfoPanel from './BattleInfoPanel';

const props = {
    targetName: 'Angry Zombie',
    skillName: 'Maths',
    level: 12,
    levelClassName: 'text-white',
    taskDescription: 'Solve the sums',
    fantasyName: 'Arithmancy',
};

describe('BattleInfoPanel', () => {
    it('shows the target, the skill, the level, the quest and the fantasy name', () => {
        render(<BattleInfoPanel {...props} />);
        for (const text of ['Angry Zombie', 'Maths', '12', 'Solve the sums', 'Arithmancy']) {
            expect(screen.getByText(text)).toBeTruthy();
        }
    });

    it('colours the level with the given class', () => {
        render(<BattleInfoPanel {...props} levelClassName="text-gold" />);
        expect(screen.getByText('12').className).toContain('text-gold');
    });
});
