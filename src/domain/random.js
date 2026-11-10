const defaultSource = () => Math.random();

let source = defaultSource;

export const random = () => source();

export const setRandomSource = (next) => {
    source = next;
};

export const resetRandomSource = () => {
    source = defaultSource;
};

export const createSeededRandom = (seed) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};
