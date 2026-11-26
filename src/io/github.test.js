import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIssue, resetGithubTransport, setGithubTransport } from './github';

afterEach(() => {
    resetGithubTransport();
    vi.unstubAllGlobals();
});

const FAKE_TOKEN = 'fake-token-for-tests';
const request = { repo: 'owner/game', token: FAKE_TOKEN, title: 'A title', body: 'A body' };

const answer = (status, json) => ({ status, json: async () => json });

describe('createIssue', () => {
    it('posts the issue to the REST API of the repository with the token', async () => {
        const fetch = vi.fn().mockResolvedValue(answer(201, { number: 7, html_url: 'https://evil.example/x' }));
        setGithubTransport({ fetch });
        const result = await createIssue(request);
        expect(result).toEqual({ ok: true, number: 7, url: 'https://github.com/owner/game/issues/7' });
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('https://api.github.com/repos/owner/game/issues');
        expect(init.method).toBe('POST');
        expect(init.headers.Authorization).toBe(`Bearer ${FAKE_TOKEN}`);
        expect(JSON.parse(init.body)).toEqual({ title: 'A title', body: 'A body' });
    });

    it('never gives the token back in a result', async () => {
        setGithubTransport({ fetch: vi.fn().mockResolvedValue(answer(401, {})) });
        expect(JSON.stringify(await createIssue(request))).not.toContain(FAKE_TOKEN);
    });

    it.each([
        [401, 'unauthorized'],
        [403, 'forbidden'],
        [404, 'notFound'],
        [410, 'issuesDisabled'],
        [422, 'invalid'],
        [429, 'rateLimited'],
        [500, 'failed'],
        [200, 'failed'],
    ])('says why GitHub refused (status %i)', async (status, reason) => {
        setGithubTransport({ fetch: vi.fn().mockResolvedValue(answer(status, {})) });
        expect(await createIssue(request)).toEqual({ ok: false, reason });
    });

    it('says network when GitHub cannot be reached', async () => {
        setGithubTransport({ fetch: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) });
        expect(await createIssue(request)).toEqual({ ok: false, reason: 'network' });
    });

    it('fails when the answer has no issue number or is not JSON', async () => {
        setGithubTransport({ fetch: vi.fn().mockResolvedValue(answer(201, { number: 'x' })) });
        expect(await createIssue(request)).toEqual({ ok: false, reason: 'failed' });
        setGithubTransport({
            fetch: vi.fn().mockResolvedValue({
                status: 201,
                json: async () => {
                    throw new SyntaxError('bad json');
                },
            }),
        });
        expect(await createIssue(request)).toEqual({ ok: false, reason: 'failed' });
    });

    it('uses the fetch of the browser at call time by default', async () => {
        const fetch = vi.fn().mockResolvedValue(answer(201, { number: 3 }));
        vi.stubGlobal('fetch', fetch);
        expect((await createIssue(request)).number).toBe(3);
        expect(fetch).toHaveBeenCalledOnce();
    });
});
