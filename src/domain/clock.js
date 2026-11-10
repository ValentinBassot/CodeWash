const defaultClock = () => Date.now();

let clock = defaultClock;

export const now = () => clock();

export const setClock = (next) => {
    clock = next;
};

export const resetClock = () => {
    clock = defaultClock;
};

export const todayKey = () => new Date(now()).toISOString().split('T')[0];
