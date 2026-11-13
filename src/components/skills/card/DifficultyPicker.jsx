import React from 'react';
import { Plus, Minus } from 'lucide-react';
import SafeImage from '../../ui/SafeImage';
import { DIFFICULTY_IMAGES } from '../../../constants/gameData';

const DifficultyPicker = ({ difficulty, unlockedDifficulty, onChange }) => (
    <div className="absolute -top-10 left-0 flex items-center gap-2 z-20">
        <button
            onClick={() => onChange(Math.max(1, difficulty - 1))}
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
            <span className="absolute -bottom-1 -right-1 bg-black/90 text-yellow-400 text-xs font-bold px-1 rounded border border-yellow-500/50 min-w-[16px] text-center">
                {difficulty}
            </span>
        </div>
        <button
            onClick={() => onChange(Math.min(unlockedDifficulty, difficulty + 1))}
            className="bg-stone-700 text-white rounded p-1 border border-stone-500 hover:bg-stone-600"
        >
            <Plus size={16} />
        </button>
    </div>
);

export default DifficultyPicker;
