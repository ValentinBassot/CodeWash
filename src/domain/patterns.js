export const MAX_TEMPO_DELAY = 800;
export const MIN_TEMPO_DELAY = 200;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (start, end, t) => start + (end - start) * clamp(t, 0, 1);

export const getTempoDelays = (completedRounds, currentDifficulty) => {
    const round = completedRounds + 1;
    const startingDelay = lerp(MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, (currentDifficulty - 1) / 6);
    const maxRunwayRounds = lerp(10, 1, (currentDifficulty - 1) / 6);
    const runwayProgress = maxRunwayRounds > 1 ? (round - 1) / (maxRunwayRounds - 1) : 1;
    const rawOnDelay = lerp(startingDelay, MIN_TEMPO_DELAY, runwayProgress);
    const onDelay = clamp(rawOnDelay, MIN_TEMPO_DELAY, MAX_TEMPO_DELAY);
    const offDelay = Math.max(100, Math.round(onDelay * 0.35));
    return { onDelay, offDelay };
};
