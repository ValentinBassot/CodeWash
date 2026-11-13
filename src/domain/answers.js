export const withoutSpaces = (text) => text.replace(/\s/g, '');

export const normalizeNumber = (raw) => raw.replace(/[^0-9-]/g, '');

export const normalizeSpelling = (raw) => withoutSpaces(raw.toUpperCase());
