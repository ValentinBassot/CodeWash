const API_ROOT = 'https://api.github.com';

const browserTransport = { fetch: (url, init) => globalThis.fetch(url, init) };

let transport = browserTransport;

export const setGithubTransport = (next) => {
    transport = next;
};

export const resetGithubTransport = () => {
    transport = browserTransport;
};

const REASONS = {
    401: 'unauthorized',
    403: 'forbidden',
    404: 'notFound',
    410: 'issuesDisabled',
    422: 'invalid',
    429: 'rateLimited',
};

export const createIssue = async ({ repo, token, title, body }) => {
    let response;
    try {
        response = await transport.fetch(`${API_ROOT}/repos/${repo}/issues`, {
            method: 'POST',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({ title, body }),
        });
    } catch {
        return { ok: false, reason: 'network' };
    }
    if (response.status !== 201) return { ok: false, reason: REASONS[response.status] ?? 'failed' };
    try {
        const { number } = await response.json();
        if (!Number.isInteger(number)) return { ok: false, reason: 'failed' };
        return { ok: true, number, url: `https://github.com/${repo}/issues/${number}` };
    } catch {
        return { ok: false, reason: 'failed' };
    }
};
