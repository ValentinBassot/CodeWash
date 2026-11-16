import React from 'react';

const MESSAGES = {
    corrupted: 'Your saved game could not be read. A new game was started and the old save was kept as a backup.',
};

const SaveProblemNotice = ({ problem, onDismiss }) => {
    if (!MESSAGES[problem]) return null;

    return (
        <div
            role="alert"
            className="w-full pointer-events-auto bg-red-900/95 text-white border-2 border-red-400 rounded-lg px-4 py-3 shadow-xl flex items-start gap-3"
        >
            <p className="text-lg leading-tight">{MESSAGES[problem]}</p>
            <button onClick={onDismiss} className="uppercase font-bold border border-white/60 rounded px-2 py-1">
                OK
            </button>
        </div>
    );
};

export default SaveProblemNotice;
