import React, { useState } from 'react';

const TypedWord = ({ onSubmit }) => {
    const [typed, setTyped] = useState('');

    const submit = (event) => {
        event.preventDefault();
        onSubmit(typed);
        setTyped('');
    };

    return (
        <form onSubmit={submit} className="w-full mt-2 flex gap-2">
            <input
                aria-label="Type the word"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder="Type the word"
                autoComplete="off"
                className="min-w-0 flex-1 bg-black/40 border-2 border-[#555] rounded px-2 py-1 text-white uppercase tracking-wider"
            />
            <button type="submit" className="px-3 rounded bg-green-700 text-white font-bold uppercase">
                OK
            </button>
        </form>
    );
};

export default TypedWord;
