const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optional = (value) => {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? null : trimmed;
};

const email = (name, value) => {
    const v = optional(value);
    if (v !== null && !EMAIL.test(v)) throw new Error(`${name} must be an e-mail address, got "${v}"`);
    return v;
};

const httpUrl = (name, value) => {
    const v = optional(value);
    if (v === null) return null;
    let url;
    try {
        url = new URL(v);
    } catch {
        throw new Error(`${name} must be an http(s) URL, got "${v}"`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`${name} must be an http(s) URL, got "${v}"`);
    }
    return v;
};

export const parseConfig = (env) => ({
    bugReportEmail: email('VITE_BUG_REPORT_EMAIL', env.VITE_BUG_REPORT_EMAIL),
    triviaApiUrl: httpUrl('VITE_TRIVIA_API_URL', env.VITE_TRIVIA_API_URL),
});

export const config = parseConfig(import.meta.env);
