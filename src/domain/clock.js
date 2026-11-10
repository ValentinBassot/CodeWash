const defaultClock = () => Date.now();

let clock = defaultClock;

export const now = () => clock();

export const setClock = (next) => {
    clock = next;
};

export const resetClock = () => {
    clock = defaultClock;
};

const twoDigits = (n) => String(n).padStart(2, '0');

export const todayKey = () => {
    const date = new Date(now());
    return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
};
