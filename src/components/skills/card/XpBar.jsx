import React from 'react';
import { calculateXPToLevel } from '../../../utils/gameUtils';

const XpBar = ({ xp, level, difficulty }) => {
    const xpToLevel = calculateXPToLevel(difficulty, level);
    const xpPercent = Math.min(100, (xp / xpToLevel) * 100);
    return (
        <div className="mt-2 bg-[#1a1a1a] p-2 rounded border border-[#333]">
            <div className="flex justify-between text-gray-400 text-xs mb-1 uppercase">
                <span>XP</span>
                <span>
                    {xp} / {xpToLevel}
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
};

export default XpBar;
