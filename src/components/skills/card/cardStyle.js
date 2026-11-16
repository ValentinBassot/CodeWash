import { BASE_ASSETS, CHEST_BLOCKS, BOSS_MOBS, HOSTILE_MOBS, MINIBOSS_MOBS } from '../../../constants/gameData';

const LEVEL_TIERS = [
    { from: 160, textColor: 'text-rainbow', border: 'border-netherite' },
    { from: 140, textColor: 'text-gray-500', border: 'border-netherite' },
    { from: 120, textColor: 'text-cyan-300', border: 'border-diamond' },
    { from: 100, textColor: 'text-emerald-400', border: 'border-emerald' },
    { from: 80, textColor: 'text-gray-200', border: 'border-iron' },
    { from: 60, textColor: 'text-yellow-400', border: 'border-gold' },
    { from: 40, textColor: 'text-stone-400', border: 'border-stone' },
    { from: 20, textColor: 'text-amber-700', border: 'border-wood' },
];

const DEFAULT_GOLD = '#FFD700';
const FALLBACK_MOB = 'Zombie';

export const getLevelStyle = (level) => {
    const tier = LEVEL_TIERS.find((t) => level >= t.from);
    return tier
        ? { textColor: tier.textColor, borderClass: tier.border }
        : { textColor: 'text-white', borderClass: 'border-stone-500' };
};

export const getBorderEffect = (selectedBorder, borderColor) => {
    if (!selectedBorder) return { className: '', style: {} };
    if (selectedBorder === 'solid' || selectedBorder === 'solid-picker') {
        const color = selectedBorder === 'solid' ? DEFAULT_GOLD : borderColor || DEFAULT_GOLD;
        return { className: '', style: { borderColor: color, boxShadow: `0 0 20px ${color}, 0 0 40px ${color}` } };
    }
    const style =
        selectedBorder === 'gradient' || selectedBorder === 'sparkle'
            ? { '--border-color': borderColor || DEFAULT_GOLD }
            : {};
    return { className: `border-effect-${selectedBorder}`, style };
};

const darken = (hex) => {
    const channel = (start) => Math.max(0, parseInt(hex.slice(start, start + 2), 16) - 40);
    return `#${[1, 3, 5].map((start) => channel(start).toString(16).padStart(2, '0')).join('')}`;
};

export const getButtonStyle = (colorStyle) => {
    const colors = colorStyle?.background?.match(/#([a-fA-F0-9]{6})/g);
    if (colors && colors.length >= 2) {
        const [from, to] = colors;
        return {
            background: `linear-gradient(to bottom, ${from}, ${to})`,
            boxShadow: `0 6px 0 ${darken(to)}`,
            borderColor: from,
        };
    }
    return {
        background: 'linear-gradient(to bottom, #7e22ce, #581c87)',
        boxShadow: '0 6px 0 #581c87',
        borderColor: '#a855f7',
    };
};

const MOB_POOLS = [
    ['hostile', HOSTILE_MOBS],
    ['boss', BOSS_MOBS],
    ['miniboss', MINIBOSS_MOBS],
    ['chest', CHEST_BLOCKS],
];

const themedMob = (roster, mobName) => {
    if (!roster) return null;
    for (const [kind, pool] of MOB_POOLS) {
        const index = Object.keys(pool).indexOf(mobName);
        const mobs = roster[kind];
        if (index >= 0 && mobs?.length) return mobs[index % mobs.length];
    }
    return null;
};

export const resolveMob = (skillId, mobName, themeMobs, roster) => {
    if (skillId === 'memory') return { src: 'assets/skills/farm_icon.png', name: mobName };
    const themed = themedMob(roster, mobName);
    if (themed) return { src: themed.src, name: themed.name };
    if (skillId === 'cleaning') {
        return { src: CHEST_BLOCKS[mobName] || themeMobs[mobName] || BASE_ASSETS.axolotls.Pink, name: mobName };
    }
    const src = HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeMobs[mobName];
    if (src) return { src, name: mobName };
    return { src: HOSTILE_MOBS[FALLBACK_MOB] || BASE_ASSETS.axolotls.Pink, name: FALLBACK_MOB };
};
