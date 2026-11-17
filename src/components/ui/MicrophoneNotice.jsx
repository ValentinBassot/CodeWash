import React from 'react';

const MESSAGES = {
    denied: 'The microphone is blocked. Allow it in the privacy settings (Microphone), then reopen the game to speak the words, or type them.',
    unavailable: 'No microphone was found. You can type the words instead.',
};

const MicrophoneNotice = ({ access, onDismiss }) => {
    if (!MESSAGES[access]) return null;

    return (
        <div
            role="alert"
            className="w-full pointer-events-auto bg-amber-900/95 text-white border-2 border-amber-400 rounded-lg px-4 py-3 shadow-xl flex items-start gap-3"
        >
            <p className="text-lg leading-tight">{MESSAGES[access]}</p>
            <button onClick={onDismiss} className="uppercase font-bold border border-white/60 rounded px-2 py-1">
                OK
            </button>
        </div>
    );
};

export default MicrophoneNotice;
