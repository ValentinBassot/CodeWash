export const countChars = (text) => Array.from(text).length;

export const cutText = (text, max) => {
    const chars = Array.from(text);
    return chars.length > max ? chars.slice(0, max).join('') : text;
};

export const wellFormed = (text) => text.toWellFormed();
