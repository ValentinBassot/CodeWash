import { describe, expect, it } from 'vitest';
import { ISSUE_TEXTS } from '../constants/bugReportTexts';
import {
    CATEGORIES,
    cleanLogText,
    ISSUE_URL_LIMIT,
    LIMITS,
    MAILTO_LIMIT,
    MAX_ISSUE_ERRORS,
    REPORT_SCHEMA,
    SAVE_FILE_SCHEMA,
    STORED_STACK_LENGTH,
    buildIssuePayload,
    buildIssueUrl,
    buildMailtoUrl,
    buildReport,
    buildSaveFile,
    buildTicket,
    compactTicket,
    isValidTicket,
    issueBody,
    parseIssueLink,
    summarizeSave,
    validateTicketFields,
} from './ticket';

const NOON = Date.parse('2026-11-26T12:00:00Z');

const fields = (overrides = {}) => ({
    title: 'The boss never dies',
    description: 'I hit the boss ten times and nothing happens.',
    category: 'bug',
    contact: '',
    ...overrides,
});

const environment = {
    runtime: 'Electron',
    language: 'fr-FR',
    viewport: '1280x720',
    userAgent: 'Mozilla/5.0 Electron/39',
};

const entry = (n, stack = '') => ({
    time: `2026-11-26T11:${String(n).padStart(2, '0')}:00.000Z`,
    source: 'window',
    message: `error ${n}`,
    stack,
});

const context = (overrides = {}) => ({
    now: NOON,
    appVersion: '1.2.3',
    environment,
    errors: [],
    saves: { 1: { theme: 'spy', skills: {} }, 2: null, 3: null },
    screenshot: null,
    ...overrides,
});

const ticketWith = (fieldOverrides = {}, contextOverrides = {}) =>
    buildTicket(fields(fieldOverrides), context(contextOverrides));

describe('validateTicketFields', () => {
    it('accepts a complete report', () => {
        expect(validateTicketFields(fields())).toEqual({});
        expect(isValidTicket(fields())).toBe(true);
    });

    it('asks for a title and a description', () => {
        expect(validateTicketFields(fields({ title: '   ', description: '' }))).toEqual({
            title: 'required',
            description: 'required',
        });
        expect(isValidTicket(fields({ title: '' }))).toBe(false);
    });

    it('treats missing fields as empty', () => {
        expect(validateTicketFields({ category: 'bug' })).toEqual({ title: 'required', description: 'required' });
    });

    it('limits the length of the title, the description and the contact', () => {
        expect(validateTicketFields(fields({ title: 'x'.repeat(LIMITS.title + 1) })).title).toBe('tooLong');
        expect(validateTicketFields(fields({ title: 'x'.repeat(LIMITS.title) })).title).toBeUndefined();
        expect(validateTicketFields(fields({ description: 'x'.repeat(LIMITS.description + 1) })).description).toBe(
            'tooLong',
        );
        expect(validateTicketFields(fields({ contact: `${'a'.repeat(LIMITS.contact)}@x.fr` })).contact).toBe('tooLong');
    });

    it('measures the length after trimming', () => {
        expect(validateTicketFields(fields({ title: ` ${'x'.repeat(LIMITS.title)} ` }))).toEqual({});
    });

    it('knows the categories', () => {
        for (const category of CATEGORIES) expect(validateTicketFields(fields({ category }))).toEqual({});
        expect(validateTicketFields(fields({ category: 'nope' })).category).toBe('invalid');
        expect(validateTicketFields(fields({ category: undefined })).category).toBe('invalid');
    });

    it('accepts an empty contact or an e-mail address, and rejects anything else', () => {
        expect(validateTicketFields(fields({ contact: '  ' }))).toEqual({});
        expect(validateTicketFields(fields({ contact: ' kid@example.com ' }))).toEqual({});
        expect(validateTicketFields(fields({ contact: 'not an email' })).contact).toBe('invalid');
    });
});

describe('summarizeSave', () => {
    it('counts the profiles with a save and lists the themes, without any name or level', () => {
        const summary = summarizeSave({
            1: { theme: 'spy', skills: { reading: { level: 99 } } },
            2: { skills: { reading: { level: 3 } } },
            3: null,
        });
        expect(summary).toEqual({ profilesWithSave: 2, unreadableSaves: 0, themes: ['minecraft', 'spy'] });
        expect(JSON.stringify(summary)).not.toContain('99');
    });

    it('lists each theme once', () => {
        expect(summarizeSave({ 1: { theme: 'spy' }, 2: { theme: 'spy' } }).themes).toEqual(['spy']);
    });

    it('counts a save that could not be read', () => {
        expect(summarizeSave({ 1: '{oops', 2: null, 3: null })).toEqual({
            profilesWithSave: 0,
            unreadableSaves: 1,
            themes: [],
        });
    });

    it('is empty for no saves', () => {
        expect(summarizeSave({})).toEqual({ profilesWithSave: 0, unreadableSaves: 0, themes: [] });
    });
});

describe('buildTicket', () => {
    it('keeps the cleaned fields and the context of the report', () => {
        const errors = [entry(1)];
        const ticket = buildTicket(
            fields({ title: '  A title ', description: ' Details ', contact: ' me@example.com ' }),
            context({
                errors,
                screenshot: { name: 'shot.png', type: 'image/png', dataUrl: 'data:image/png;base64,AAAA' },
            }),
        );
        expect(ticket).toEqual({
            title: 'A title',
            description: 'Details',
            category: 'bug',
            contact: 'me@example.com',
            createdAt: '2026-11-26T12:00:00.000Z',
            appVersion: '1.2.3',
            environment,
            errors,
            saveSummary: { profilesWithSave: 1, unreadableSaves: 0, themes: ['spy'] },
            screenshot: { name: 'shot.png', type: 'image/png' },
        });
    });

    it('has no contact and no screenshot by default, and never copies profile names or levels', () => {
        const ticket = buildTicket(
            { title: 'T', description: 'D', category: 'other' },
            context({ saves: { 1: { theme: 'minecraft', skills: { reading: { level: 77 } }, name: 'Robo' } } }),
        );
        expect(ticket.contact).toBe('');
        expect(ticket.screenshot).toBeNull();
        expect(JSON.stringify(ticket)).not.toMatch(/Robo|77/);
    });
});

describe('compactTicket', () => {
    it('keeps the most recent errors with short stacks', () => {
        const errors = Array.from({ length: MAX_ISSUE_ERRORS + 5 }, (_, n) => entry(n, 's'.repeat(2000)));
        const compact = compactTicket(ticketWith({}, { errors }));
        expect(compact.errors).toHaveLength(MAX_ISSUE_ERRORS);
        expect(compact.errors[0].message).toBe('error 5');
        expect(compact.errors[0].stack).toHaveLength(STORED_STACK_LENGTH);
        expect(compact.title).toBe('The boss never dies');
    });
});

describe('issueBody', () => {
    it('writes the description, the details and the save summary in Markdown', () => {
        const body = issueBody(
            ticketWith({ contact: 'me@example.com' }, { screenshot: { name: 'shot.png', type: 'image/png' } }),
        );
        expect(body).toContain('## Description\n\nI hit the boss ten times and nothing happens.\n');
        expect(body).toContain('- Category: bug');
        expect(body).toContain('- Reported: 2026-11-26T12:00:00.000Z');
        expect(body).toContain('- App version: 1.2.3');
        expect(body).toContain('- Environment: Electron, fr-FR, 1280x720 (Mozilla/5.0 Electron/39)');
        expect(body).toContain(`- Screenshot: ${ISSUE_TEXTS.screenshotAttached('shot.png')}`);
        expect(body).toContain('- Profiles with a save: 1 of 3');
        expect(body).toContain('- Themes: spy');
        expect(body).toContain('- Unreadable saves: 0');
        expect(body).toContain('No error recorded.');
    });

    it('never publishes the e-mail of the reporter', () => {
        const withContact = issueBody(ticketWith({ contact: 'me@example.com' }));
        expect(withContact).not.toContain('me@example.com');
        expect(withContact).toContain(`- Contact: ${ISSUE_TEXTS.contactLeft}`);
        expect(issueBody(ticketWith())).toContain('- Contact: none');
        expect(issueBody(ticketWith())).toContain('- Screenshot: none');
    });

    it('says none when no theme is known', () => {
        expect(issueBody(ticketWith({}, { saves: {} }))).toContain('- Themes: none');
    });

    it('shows the errors in a code block, most recent last, with the top of the stack', () => {
        const stack = Array.from({ length: 10 }, (_, n) => `at line${n}`).join('\n');
        const body = issueBody(ticketWith({}, { errors: [entry(1, stack), entry(2)] }));
        expect(body).toContain('2 of 2 recorded errors, most recent last.');
        expect(body).toContain('```text\n[2026-11-26T11:01:00.000Z] window: error 1\nat line0');
        expect(body).toContain('at line5');
        expect(body).not.toContain('at line6');
        expect(body.indexOf('error 1')).toBeLessThan(body.indexOf('error 2'));
        expect(body).not.toContain(ISSUE_TEXTS.errorLogCut);
    });

    it('cannot be broken out of by a log that contains a code fence', () => {
        const bad = { ...entry(1), message: 'oops ``` # injected', stack: 'at ```` x\nat `y`' };
        const body = issueBody(ticketWith({}, { errors: [bad] }));
        expect(body.match(/```/g)).toHaveLength(2);
    });

    it('shows at most the most recent errors and says so', () => {
        const errors = Array.from({ length: MAX_ISSUE_ERRORS + 4 }, (_, n) => entry(n));
        const body = issueBody(ticketWith({}, { errors }));
        expect(body).toContain(`${MAX_ISSUE_ERRORS} of ${MAX_ISSUE_ERRORS + 4} recorded errors`);
        expect(body).toContain(ISSUE_TEXTS.errorLogCut);
        expect(body).not.toContain('error 3\n');
        expect(body).toContain('error 23');
    });

    it('can leave every error out', () => {
        const body = issueBody(ticketWith({}, { errors: [entry(1)] }), { errorCount: 0 });
        expect(body).toContain('0 of 1 recorded errors');
        expect(body).toContain(ISSUE_TEXTS.errorLogCut);
        expect(body).not.toContain('```');
    });

    it('can cut the description and says so', () => {
        const body = issueBody(ticketWith({ description: 'abcdefghij' }), { descriptionLimit: 4 });
        expect(body).toContain('## Description\n\nabcd\n\nThe description was cut');
        expect(issueBody(ticketWith({ description: 'abcdefghij' }))).not.toContain('was cut');
    });
});

describe('what the public issue shows of the error log', () => {
    const jsonError = `Unexpected token 'z', ..."name":"Alice","hp":zzz}" is not valid JSON`;

    it('drops the quoted text and everything after the first ellipsis', () => {
        expect(cleanLogText(jsonError)).toBe(`Unexpected token ${ISSUE_TEXTS.removed} is not valid JSON`);
        expect(cleanLogText('Cannot find "secret.txt" or `other` here')).toBe(
            `Cannot find ${ISSUE_TEXTS.removed} or ${ISSUE_TEXTS.removed} here`,
        );
    });

    it('keeps no part of the data of a short invalid JSON, even when it holds quotes', () => {
        const expected = `Unexpected token ${ISSUE_TEXTS.removed} is not valid JSON`;
        expect(cleanLogText(`Unexpected token 'x', "["Zoe","Max"x" is not valid JSON`)).toBe(expected);
        expect(cleanLogText(`Unexpected token 'x', "{"name":"Zoe"}x" is not valid JSON`)).toBe(expected);
        expect(cleanLogText(`"undefined" is not valid JSON`)).toBe(`${ISSUE_TEXTS.removed} is not valid JSON`);
    });

    it('keeps an apostrophe inside a word and the rest of the message', () => {
        expect(cleanLogText("Can't read properties of undefined (reading 'x')")).toBe(
            `Can't read properties of undefined (reading ${ISSUE_TEXTS.removed})`,
        );
    });

    it.each([
        ['at x (file:///C:/Users/Alice/AppData/app.js:1:1)', 'at x (app.js:1:1)'],
        ['at x (C:\\Users\\Alice\\app.js:1:1)', 'at x (app.js:1:1)'],
        ['at x (/home/alice/project/src/App.jsx:10:5)', 'at x (App.jsx:10:5)'],
        ['at x (http://localhost:5173/src/App.jsx:10:5)', 'at x (App.jsx:10:5)'],
        ['render@file:///home/alice/game/index.js:3:9', 'render@index.js:3:9'],
        ['ENOENT /Users/alice/save.json', 'ENOENT save.json'],
        ['either and/or this', 'either and/or this'],
    ])('reduces the absolute path of %s to the file name', (text, expected) => {
        expect(cleanLogText(text)).toBe(expected);
    });

    it('bounds the length', () => {
        expect(Array.from(cleanLogText('x'.repeat(500)))).toHaveLength(200);
    });

    it('is applied to the message and the top of the stack in the issue, never to the stored ticket', () => {
        const dirty = {
            ...entry(1),
            message: jsonError,
            stack: `SyntaxError: ${jsonError}\n    at x (file:///C:/Users/Alice/AppData/app.js:1:1)`,
        };
        const ticket = ticketWith({}, { errors: [dirty] });
        const body = issueBody(ticket);
        expect(body).not.toMatch(/Alice|zzz|hp|C:|Users/);
        expect(body).toContain('app.js:1:1');
        expect(ticket.errors[0].message).toBe(jsonError);
    });
});

describe('text cut on characters', () => {
    it('never breaks an emoji at the border of the stored stack, the issue description or the links', () => {
        const stack = `${'s'.repeat(STORED_STACK_LENGTH - 1)}😀 end`;
        const [stored] = compactTicket(ticketWith({}, { errors: [{ ...entry(1), stack }] })).errors;
        expect(stored.stack.endsWith('😀')).toBe(true);

        const description = `${'a'.repeat(99)}😀${'b'.repeat(400)}`;
        const body = issueBody(ticketWith({ description }), { descriptionLimit: 100 });
        expect(body).toContain(`${'a'.repeat(99)}😀\n`);

        const errors = [{ ...entry(1), message: `${'m'.repeat(499)}😀😀` }];
        const emojiDescription = '😀'.repeat(900);
        for (const build of [
            () => buildIssueUrl('a/b', ticketWith({ description: emojiDescription }, { errors }), 1500),
            () => buildMailtoUrl('me@example.com', ticketWith({ description: emojiDescription }, { errors }), 1500),
        ]) {
            const { url, truncated } = build();
            expect(truncated.description).toBe(true);
            expect(() => decodeURIComponent(url.slice(url.indexOf('body=') + 5))).not.toThrow();
        }
    });

    it('replaces a lone surrogate instead of failing to build the link', () => {
        const broken = ticketWith({ title: `bad ${'😀'.slice(0, 1)}`, description: `x ${'😀'.slice(1)}` });
        expect(() => buildIssueUrl('a/b', broken)).not.toThrow();
        expect(() => buildMailtoUrl('me@example.com', broken)).not.toThrow();
    });
});

describe('buildIssueUrl', () => {
    it('opens the new issue page of the repository, filled in', () => {
        const { url, truncated } = buildIssueUrl('ValentinBassot/CodeWash', ticketWith({ title: 'A & B' }));
        expect(url.startsWith('https://github.com/ValentinBassot/CodeWash/issues/new?title=A%20%26%20B&body=')).toBe(
            true,
        );
        const body = new URL(url).searchParams.get('body');
        expect(body).toBe(issueBody(ticketWith({ title: 'A & B' })));
        expect(truncated).toEqual({ errors: false, description: false });
        expect(url.length).toBeLessThanOrEqual(ISSUE_URL_LIMIT);
    });

    it('drops the oldest errors first until the link is short enough', () => {
        const errors = Array.from({ length: 10 }, (_, n) => entry(n, 'x'.repeat(400)));
        const ticket = ticketWith({}, { errors });
        const full = buildIssueUrl('a/b', ticket, 1e9);
        const { url, truncated } = buildIssueUrl('a/b', ticket, full.url.length - 1);
        expect(url.length).toBeLessThan(full.url.length);
        expect(truncated).toEqual({ errors: true, description: false });
        const body = new URL(url).searchParams.get('body');
        expect(body).toContain('error 9');
        expect(body).not.toContain('error 0');
        expect(body).toContain(ISSUE_TEXTS.errorLogCut);
    });

    it('cuts the description when the errors are gone and it is still too long', () => {
        const ticket = ticketWith({ description: 'word '.repeat(700) });
        const { url, truncated } = buildIssueUrl('a/b', ticket, 3000);
        expect(url.length).toBeLessThanOrEqual(3000);
        expect(truncated.description).toBe(true);
        expect(new URL(url).searchParams.get('body')).toContain(ISSUE_TEXTS.descriptionCut);
    });

    it('does what it can when nothing fits', () => {
        const { url, truncated } = buildIssueUrl('a/b', ticketWith(), 10);
        expect(url.length).toBeGreaterThan(10);
        expect(truncated).toEqual({ errors: false, description: true });
    });
});

describe('buildMailtoUrl', () => {
    it('builds an e-mail to the contact with the report in the body', () => {
        const { url } = buildMailtoUrl('support@example.com', ticketWith({ title: 'Hello there' }));
        expect(url.startsWith('mailto:support@example.com?subject=Hello%20there&body=')).toBe(true);
        expect(new URL(url).searchParams.get('body')).toContain('I hit the boss');
    });

    it('adds the contact of the reporter to the e-mail only, never to the issue', () => {
        const ticket = ticketWith({ contact: 'kid@example.com' });
        const mail = new URL(buildMailtoUrl('support@example.com', ticket).url).searchParams.get('body');
        expect(mail).toContain(ISSUE_TEXTS.mailContact('kid@example.com'));
        expect(buildIssueUrl('a/b', ticket).url).not.toContain('kid');
        expect(issueBody(ticket)).not.toContain('kid@example.com');
        const without = new URL(buildMailtoUrl('support@example.com', ticketWith()).url).searchParams.get('body');
        expect(without).not.toContain(ISSUE_TEXTS.mailContact(''));
    });

    it('is kept short for the e-mail programs', () => {
        const errors = Array.from({ length: 20 }, (_, n) => entry(n, 'x'.repeat(500)));
        const { url, truncated } = buildMailtoUrl('support@example.com', ticketWith({}, { errors }));
        expect(url.length).toBeLessThanOrEqual(MAILTO_LIMIT);
        expect(truncated.errors).toBe(true);
    });
});

describe('buildIssuePayload', () => {
    it('is the title and the body of the issue, with no length limit', () => {
        const ticket = ticketWith({}, { errors: [entry(1, 'x'.repeat(5000))] });
        expect(buildIssuePayload(ticket)).toEqual({ title: ticket.title, body: issueBody(ticket) });
    });
});

describe('buildReport', () => {
    it('holds the whole ticket, the Markdown, the screenshot and the save file', () => {
        const ticket = ticketWith();
        const screenshot = { name: 'shot.png', type: 'image/png', dataUrl: 'data:image/png;base64,AAAA' };
        const saveFile = { schema: SAVE_FILE_SCHEMA };
        expect(buildReport(ticket, { screenshot, saveFile })).toEqual({
            schema: REPORT_SCHEMA,
            ticket,
            privacy: ISSUE_TEXTS.reportWarning,
            issueMarkdown: issueBody(ticket),
            screenshot,
            saveFile,
        });
    });

    it('works without attachments', () => {
        const report = buildReport(ticketWith());
        expect(report.screenshot).toBeNull();
        expect(report.saveFile).toBeNull();
    });
});

describe('buildSaveFile', () => {
    it('wraps the saves with the version and the date of the export', () => {
        const saves = { 1: { theme: 'spy' }, 2: null, 3: '{oops' };
        expect(
            buildSaveFile({
                appVersion: '1.2.3',
                exportedAt: NOON,
                currentProfile: 2,
                profileNames: { 1: 'Robo' },
                saves,
            }),
        ).toEqual({
            schema: SAVE_FILE_SCHEMA,
            appVersion: '1.2.3',
            exportedAt: '2026-11-26T12:00:00.000Z',
            currentProfile: 2,
            profileNames: { 1: 'Robo' },
            saves,
        });
    });
});

describe('parseIssueLink', () => {
    it('reads the number of an issue of the repository', () => {
        expect(
            parseIssueLink('ValentinBassot/CodeWash', ' https://github.com/valentinbassot/codewash/issues/12/ '),
        ).toEqual({ url: 'https://github.com/ValentinBassot/CodeWash/issues/12', number: 12 });
    });

    it.each([
        ['not a link', 'issue 12'],
        ['undefined', undefined],
        ['another repository', 'https://github.com/other/CodeWash/issues/12'],
        ['another site', 'https://example.com/ValentinBassot/CodeWash/issues/12'],
        ['not https', 'http://github.com/ValentinBassot/CodeWash/issues/12'],
        ['not an issue', 'https://github.com/ValentinBassot/CodeWash/pull/12'],
        ['no number', 'https://github.com/ValentinBassot/CodeWash/issues'],
        ['a bad number', 'https://github.com/ValentinBassot/CodeWash/issues/0'],
        ['a text number', 'https://github.com/ValentinBassot/CodeWash/issues/abc'],
        ['more path', 'https://github.com/ValentinBassot/CodeWash/issues/12/extra'],
    ])('refuses %s', (_, text) => {
        expect(parseIssueLink('ValentinBassot/CodeWash', text)).toBeNull();
    });
});
