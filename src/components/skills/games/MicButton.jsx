import React from 'react';
import { Mic } from 'lucide-react';

const MicButton = ({ isListening, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-center p-2 rounded border-2 transition-colors flex items-center justify-center gap-2 ${isListening ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:bg-white/10'}`}
    >
        {isListening ? (
            <Mic className="inline animate-pulse text-red-500" />
        ) : (
            <>
                <Mic className="inline text-gray-500" />
                <span className="text-xs uppercase font-bold text-stone-400">Tap to Speak</span>
            </>
        )}
    </button>
);

export default MicButton;
