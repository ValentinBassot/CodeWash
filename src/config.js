const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const optional = (value) => {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? null : trimmed;
};

const email = (name, value) => {
    const v = optional(value);
    if (v !== null && !EMAIL.test(v)) throw new Error(`${name} must be an e-mail address, got "${v}"`);
    return v;
};

const repository = (name, value) => {
    const v = optional(value);
    const dotted = v !== null && v.split('/').some((part) => part === '.' || part === '..');
    if (v !== null && (!REPOSITORY.test(v) || dotted)) throw new Error(`${name} must look like owner/name, got "${v}"`);
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
    bugReportRepo: repository('VITE_BUG_REPORT_REPO', env.VITE_BUG_REPORT_REPO),
    triviaApiUrl: httpUrl('VITE_TRIVIA_API_URL', env.VITE_TRIVIA_API_URL),
});

export const config = parseConfig(import.meta.env);
