import React from 'react';
import { Gift } from 'lucide-react';
import SafeImage from './SafeImage';

const LevelToast = ({ level, skillName, item, img }) => (
    <div className="animate-toast w-full">
        <div className="bg-black/80 border-4 border-yellow-500 rounded-3xl p-3 md:p-4 px-4 md:px-12 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-yellow-500/20 p-2 md:p-3 rounded-full border-2 border-yellow-400">
                    <Gift size={32} className="text-yellow-300 animate-bounce w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="text-left">
                    <h2 className="text-lg md:text-2xl text-yellow-400 font-bold leading-none mb-1">
                        LEVEL {level} REACHED!
                    </h2>
                    <p className="text-stone-300 text-sm">{skillName}</p>
                </div>
            </div>
            <div className="text-right pl-3 md:pl-8 border-l-2 border-stone-600 flex items-center gap-3 md:gap-4">
                <SafeImage src={img} alt="Badge" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                <div>
                    <p className="text-stone-400 text-xs uppercase tracking-wider">Unlocked</p>
                    <p className="text-lg md:text-2xl text-green-400 font-bold">{item}</p>
                </div>
            </div>
        </div>
    </div>
);

export default LevelToast;
