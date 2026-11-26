import { attempt } from './safe';

export const EVENT_TYPES = ['error', 'crash', 'latency', 'fps', 'flow'];

export const FLOW_NAMES = [
    'app-start',
    'profile-loaded',
    'battle-start',
    'battle-end',
    'speech-error',
    'save-corrupted',
    'mic-denied',
    'drawer-open',
];

export const FLOW_DETAIL_KEYS = ['skillId', 'outcome', 'reason', 'drawer', 'profileId', 'difficulty'];

export const FLOW_DETAIL_VALUES = {
    outcome: ['left', 'death', 'completed'],
    drawer: ['settings', 'cosmetics', 'menu', 'health', 'bug-report'],
    reason: [
        'not-allowed',
        'service-not-allowed',
        'audio-capture',
        'network',
        'aborted',
        'bad-grammar',
        'language-not-supported',
        'no-speech',
        'speech',
        'permission',
    ],
};

export const ERROR_ORIGINS = ['window', 'promise'];

export const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 200;
const MAX_STACK_LENGTH = 500;

const FLOW_VALUE_PATTERN = /^[a-z0-9_-]{1,60}$/i;

const text = (value, fallback, max) => {
    const raw = value === undefined || value === null ? fallback : attempt(() => String(value), fallback);
    return raw.slice(0, max);
};

export const sanitizeMessage = (value, max = MAX_MESSAGE_LENGTH) => {
    const raw = text(value, '', Number.MAX_SAFE_INTEGER);
    const cut = raw.includes('...') ? raw.slice(0, raw.indexOf('...')) : raw;
    const unquoted = cut.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
    const quote = unquoted.search(/['"`]/);
    const kept = quote === -1 ? unquoted : unquoted.slice(0, quote);
    return kept.replace(/\s+/g, ' ').trim().slice(0, max);
};

const count = (value) => {
    const number = attempt(() => Number(value), NaN);
    return Number.isFinite(number) && number >= 0 ? Math.round(number * 10) / 10 : 0;
};

const isAllowedFlowText = (key, value) =>
    FLOW_DETAIL_VALUES[key] ? FLOW_DETAIL_VALUES[key].includes(value) : FLOW_VALUE_PATTERN.test(value);

const pickDetail = (detail) => {
    const picked = {};
    FLOW_DETAIL_KEYS.forEach((key) => {
        const value = attempt(() => detail?.[key]);
        if (typeof value === 'string' && isAllowedFlowText(key, value)) picked[key] = value;
        if (typeof value === 'number' && Number.isFinite(value)) picked[key] = value;
        if (typeof value === 'boolean') picked[key] = value;
    });
    return picked;
};

const BUILDERS = {
    error: (data) => ({
        errorType: sanitizeMessage(data.errorType, MAX_NAME_LENGTH) || 'Error',
        message: sanitizeMessage(data.message),
        origin: ERROR_ORIGINS.includes(data.origin) ? data.origin : 'window',
    }),
    crash: (data) => ({
        errorType: sanitizeMessage(data.errorType, MAX_NAME_LENGTH) || 'Error',
        message: sanitizeMessage(data.message),
        componentStack: text(data.componentStack, '', MAX_STACK_LENGTH),
    }),
    latency: (data) => ({
        name: text(data.name, 'unknown', MAX_NAME_LENGTH),
        durationMs: count(data.durationMs),
        ok: data.ok !== false,
    }),
    fps: (data) => ({
        average: count(data.average),
        min: count(data.min),
        samples: Math.round(count(data.samples)),
    }),
    flow: (data) => ({
        name: data.name,
        detail: pickDetail(data.detail),
    }),
};

export const buildEvent = (type, data = {}) => {
    if (!EVENT_TYPES.includes(type)) return null;
    if (type === 'flow' && !FLOW_NAMES.includes(data.name)) return null;
    return { type, ...BUILDERS[type](data) };
};

export const describeError = (error) => ({
    errorType:
        sanitizeMessage(
            attempt(() => error?.name),
            MAX_NAME_LENGTH,
        ) || 'Error',
    message: sanitizeMessage(attempt(() => error?.message)),
});
