import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import BugReportDrawer from './BugReportDrawer';
import { BUG_REPORT_TEXTS as T, ISSUE_TEXTS } from '../../constants/bugReportTexts';
import { resetClock, setClock } from '../../domain/clock';
import { buildTicket } from '../../domain/ticket';
import { resetDownloader, setDownloader } from '../../io/download';
import { resetExternalOpener, setExternalOpener } from '../../io/environment';
import { clearErrorLog, recordError } from '../../io/errorLog';
import { resetGithubTransport, setGithubTransport } from '../../io/github';
import { resetScreenshotProvider, setScreenshotProvider } from '../../io/screenshot';
import {
    addTicket,
    readGithubToken,
    readTickets,
    updateTicket,
    writeGithubToken,
} from '../../persistence/profileStorage';

const NOON = Date.parse('2026-11-26T12:00:00Z');
const FAKE_TOKEN = 'fake-token-for-tests';

const memoryStorage = (entries = {}) => {
    const data = { ...entries };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        },
        removeItem: (key) => {
            delete data[key];
        },
    };
};

const SETTINGS = { bugReportEmail: 'support@example.com', bugReportRepo: 'owner/game' };

let opened;
let downloads;
let fetch;

beforeEach(() => {
    setClock(() => NOON);
    clearErrorLog();
    opened = [];
    downloads = [];
    fetch = vi.fn();
    setExternalOpener((url) => opened.push(url));
    setDownloader((filename, text) => downloads.push({ filename, data: JSON.parse(text) }));
    setGithubTransport({ fetch });
});

afterEach(() => {
    resetClock();
    clearErrorLog();
    resetExternalOpener();
    resetDownloader();
    resetGithubTransport();
    resetScreenshotProvider();
    vi.restoreAllMocks();
});

const answer = (status, json = {}) => ({ status, json: async () => json });

const show = ({ settings = SETTINGS, storage = memoryStorage(), ...props } = {}) => {
    const onClose = vi.fn();
    const onOpen = vi.fn();
    const view = render(
        <BugReportDrawer isOpen onClose={onClose} onOpen={onOpen} storage={storage} settings={settings} {...props} />,
    );
    return { storage, onClose, onOpen, ...view };
};

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fill = ({ title = 'The boss never dies', description = 'I hit it ten times.', category, contact } = {}) => {
    type(T.form.title, title);
    type(T.form.description, description);
    if (category) type(T.form.category, category);
    if (contact) type(T.form.reporterContact, contact);
};

const findAlert = async () => {
    await screen.findAllByRole('alert');
    return screen.getAllByRole('alert').at(-1);
};

const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

const sampleTicket = (title = 'Old problem') =>
    buildTicket(
        { title, description: 'It happened.', category: 'bug' },
        {
            now: NOON,
            appVersion: '1.0.0',
            environment: { runtime: 'Browser', userAgent: 'UA', language: 'en', viewport: '1x1' },
            errors: [],
            saves: {},
            screenshot: null,
        },
    );

describe('the drawer', () => {
    it('is a dialog with the contact of the game, the form and the empty ticket list', () => {
        show();
        const dialog = screen.getByRole('dialog', { name: T.drawerLabel });
        expect(dialog.hasAttribute('inert')).toBe(false);
        expect(
            within(dialog)
                .getByRole('link', { name: T.contact.mailLink('support@example.com') })
                .getAttribute('href'),
        ).toBe('mailto:support@example.com');
        expect(screen.getByLabelText(T.form.title)).toBeTruthy();
        expect(screen.getByLabelText(T.form.description)).toBeTruthy();
        expect(screen.getByLabelText(T.form.category).value).toBe('bug');
        expect(screen.getByText(T.tickets.empty)).toBeTruthy();
        expect(screen.getByRole('button', { name: T.actions.sendMail })).toBeTruthy();
    });

    it('puts the focus in the title when it opens', () => {
        show();
        expect(document.activeElement).toBe(screen.getByLabelText(T.form.title));
    });

    it('is inert and hidden from assistive technology when closed', () => {
        show({ isOpen: false });
        const dialog = document.querySelector(`[role="dialog"][aria-label="${T.drawerLabel}"]`);
        expect(dialog.hasAttribute('inert')).toBe(true);
        expect(dialog.getAttribute('aria-hidden')).toBe('true');
        expect(document.activeElement).toBe(document.body);
    });

    it('builds its form only when it is opened for the first time, and keeps it afterwards', () => {
        const { rerender, storage, onClose, onOpen } = show({ isOpen: false });
        expect(document.querySelector('#bug-title')).toBeNull();
        const props = { onClose, onOpen, storage, settings: SETTINGS };
        rerender(<BugReportDrawer isOpen {...props} />);
        expect(document.activeElement).toBe(screen.getByLabelText(T.form.title));
        fill();
        rerender(<BugReportDrawer isOpen={false} {...props} />);
        expect(screen.getByLabelText(T.form.title).value).toBe('The boss never dies');
    });

    it('closes with its close button', () => {
        const { onClose } = show();
        press(T.close);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('says when no contact or repository is configured, and cannot create an issue', () => {
        show({ settings: { bugReportEmail: null, bugReportRepo: null } });
        expect(screen.getByText(T.contact.none)).toBeTruthy();
        expect(screen.getByText(T.form.noRepository)).toBeTruthy();
        expect(screen.queryByRole('button', { name: T.actions.sendMail })).toBeNull();
        expect(screen.getByRole('button', { name: T.actions.createIssue }).disabled).toBe(true);
        fill();
        fireEvent.submit(screen.getByRole('button', { name: T.actions.createIssue }).closest('form'));
        expect(opened).toEqual([]);
    });

    it('counts the errors that will be included', () => {
        const { unmount } = show();
        expect(screen.getByText(T.attachments.errorLog(0))).toBeTruthy();
        unmount();
        recordError('window', 'boom');
        show();
        expect(screen.getByText(T.attachments.errorLog(1))).toBeTruthy();
    });
});

describe('validation', () => {
    it('explains what is missing and stores no ticket', () => {
        const { storage } = show();
        press(T.actions.createIssue);
        expect(screen.getByText(T.validation.titleRequired)).toBeTruthy();
        expect(screen.getByText(T.validation.descriptionRequired)).toBeTruthy();
        expect(screen.getByText(T.feedback.invalid)).toBeTruthy();
        expect(screen.getByLabelText(T.form.title).getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByLabelText(T.form.title).getAttribute('aria-describedby')).toBe('bug-title-error');
        expect(readTickets(storage)).toEqual([]);
        expect(opened).toEqual([]);
    });

    it('refuses a title or a description that is too long, and a contact that is not an e-mail', () => {
        show();
        fill({ title: 'x'.repeat(121), description: 'y'.repeat(4001), contact: 'nope' });
        press(T.actions.createIssue);
        expect(screen.getByText(T.validation.titleTooLong(120))).toBeTruthy();
        expect(screen.getByText(T.validation.descriptionTooLong(4000))).toBeTruthy();
        expect(screen.getByText(T.validation.contactInvalid)).toBeTruthy();
        expect(screen.getByLabelText(T.form.reporterContact).getAttribute('aria-describedby')).toBe(
            'bug-contact-error bug-contact-hint',
        );
    });

    it('refuses a contact that is too long', () => {
        show();
        fill({ contact: `${'a'.repeat(200)}@example.com` });
        press(T.actions.createIssue);
        expect(screen.getByText(T.validation.contactTooLong(200))).toBeTruthy();
    });

    it('clears the messages once the form is right', () => {
        show();
        press(T.actions.createIssue);
        fill();
        press(T.actions.createIssue);
        expect(screen.queryByText(T.validation.titleRequired)).toBeNull();
    });
});

describe('creating the issue without a token', () => {
    it('opens the new issue page of the repository, keeps the ticket and empties the form', async () => {
        const { storage } = show();
        fill({ category: 'audio', contact: 'kid@example.com' });
        press(T.actions.createIssue);
        expect(await screen.findByText(T.feedback.openedPage)).toBeTruthy();
        expect(opened).toHaveLength(1);
        const url = new URL(opened[0]);
        expect(url.origin + url.pathname).toBe('https://github.com/owner/game/issues/new');
        expect(url.searchParams.get('title')).toBe('The boss never dies');
        const body = url.searchParams.get('body');
        expect(body).toContain('I hit it ten times.');
        expect(body).toContain('- Category: audio');
        expect(body).not.toContain('kid@example.com');
        expect(fetch).not.toHaveBeenCalled();

        const [record] = readTickets(storage);
        expect(record).toMatchObject({ id: 1, state: 'opened', issueUrl: null });
        expect(record.ticket.contact).toBe('kid@example.com');
        expect(screen.getByText('The boss never dies', { selector: 'strong' })).toBeTruthy();
        expect(screen.getByText(T.tickets.states.opened)).toBeTruthy();
        expect(screen.getByLabelText(T.form.title).value).toBe('');
        expect(screen.getByLabelText(T.form.description).value).toBe('');
    });

    it('tells when the link was too short for the whole report', async () => {
        for (let n = 0; n < 20; n++) recordError('window', `error ${n}`, 'x'.repeat(500));
        show();
        fill({ description: 'word '.repeat(700) });
        press(T.actions.createIssue);
        expect(await screen.findByText(`${T.feedback.openedPage} ${T.feedback.openedTruncated}`)).toBeTruthy();
        expect(opened[0].length).toBeLessThanOrEqual(7000);
    });

    it('still opens the page when the ticket cannot be saved, and says so', async () => {
        const storage = memoryStorage();
        storage.setItem = () => {
            throw new Error('quota');
        };
        show({ storage });
        fill();
        press(T.actions.createIssue);
        expect(await screen.findByText(`${T.feedback.openedPage} ${T.feedback.storageFailed}`)).toBeTruthy();
        expect(opened).toHaveLength(1);
        expect(screen.getByLabelText(T.form.title).value).toBe('The boss never dies');
    });
});

describe('creating the issue with a token', () => {
    const withToken = () => memoryStorage({ bugReportGithubToken_v1: FAKE_TOKEN });

    it('creates it through the API and keeps the link of the issue', async () => {
        fetch.mockResolvedValue(answer(201, { number: 7 }));
        const { storage } = show({ storage: withToken() });
        fill();
        press(T.actions.createIssue);
        expect(await screen.findByText(T.feedback.created(7))).toBeTruthy();
        expect(opened).toEqual([]);
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('https://api.github.com/repos/owner/game/issues');
        expect(init.headers.Authorization).toBe(`Bearer ${FAKE_TOKEN}`);
        expect(JSON.parse(init.body).title).toBe('The boss never dies');
        expect(readTickets(storage)[0]).toMatchObject({
            state: 'created',
            issueUrl: 'https://github.com/owner/game/issues/7',
            issueNumber: 7,
        });
        const link = screen.getByRole('link', { name: T.tickets.issueLink(7) });
        expect(link.getAttribute('href')).toBe('https://github.com/owner/game/issues/7');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        expect(screen.queryByRole('button', { name: T.tickets.sendAgain })).toBeNull();
        expect(document.body.innerHTML).not.toContain(FAKE_TOKEN);
        expect(JSON.stringify(storage.data.bugTickets_v1)).not.toContain(FAKE_TOKEN);
    });

    it('shows that it is working and ignores a second submit meanwhile', async () => {
        let finish;
        fetch.mockReturnValue(new Promise((resolve) => (finish = resolve)));
        show({ storage: withToken() });
        fill();
        press(T.actions.createIssue);
        const working = await screen.findByRole('button', { name: T.actions.creating });
        expect(working.disabled).toBe(true);
        fireEvent.submit(working.closest('form'));
        finish(answer(201, { number: 1 }));
        expect(await screen.findByText(T.feedback.created(1))).toBeTruthy();
        expect(fetch).toHaveBeenCalledOnce();
    });

    it.each([
        [401, 'unauthorized'],
        [403, 'forbidden'],
        [404, 'notFound'],
        [410, 'issuesDisabled'],
        [422, 'invalid'],
        [429, 'rateLimited'],
        [500, 'failed'],
    ])('explains a refusal %i, keeps the ticket and lets the player send it again', async (status, reason) => {
        fetch.mockResolvedValue(answer(status));
        const { storage } = show({ storage: withToken() });
        fill();
        press(T.actions.createIssue);
        expect((await findAlert()).textContent).toBe(T.feedback.issueFailed[reason]);
        expect(readTickets(storage)[0].state).toBe('pending');
        expect(screen.getByText(T.tickets.states.pending)).toBeTruthy();
        expect(screen.getByRole('button', { name: T.tickets.sendAgain })).toBeTruthy();
    });

    it('explains that GitHub cannot be reached, then sends the ticket again with success', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const { storage } = show({ storage: withToken() });
        fill();
        press(T.actions.createIssue);
        expect(await screen.findByText(T.feedback.issueFailed.network)).toBeTruthy();

        fetch.mockResolvedValue(answer(201, { number: 12 }));
        press(T.tickets.sendAgain);
        expect(await screen.findByText(T.feedback.created(12))).toBeTruthy();
        expect(readTickets(storage)).toHaveLength(1);
        expect(readTickets(storage)[0].state).toBe('created');
        expect(screen.getByRole('link', { name: T.tickets.issueLink(12) })).toBeTruthy();
    });
});

describe('offline', () => {
    it('keeps the ticket and does not call anyone', async () => {
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
        const { storage } = show({ storage: memoryStorage({ bugReportGithubToken_v1: FAKE_TOKEN }) });
        fill();
        press(T.actions.createIssue);
        expect((await findAlert()).textContent).toBe(T.feedback.offline);
        expect(fetch).not.toHaveBeenCalled();
        expect(opened).toEqual([]);
        expect(readTickets(storage)[0].state).toBe('pending');
        expect(screen.getByRole('button', { name: T.tickets.sendAgain })).toBeTruthy();
    });
});

describe('the ticket list', () => {
    const seeded = () => {
        const storage = memoryStorage();
        addTicket(storage, { state: 'pending', ticket: sampleTicket('First') });
        addTicket(storage, { state: 'opened', ticket: sampleTicket('Second') });
        const third = addTicket(storage, { state: 'pending', ticket: sampleTicket('Third') });
        updateTicket(storage, third.id, {
            state: 'created',
            issueUrl: 'https://github.com/owner/game/issues/4',
            issueNumber: 4,
        });
        return storage;
    };

    it('shows the title, the date, the state and the link, the most recent first', () => {
        show({ storage: seeded() });
        const items = screen.getAllByRole('listitem');
        expect(items.map((item) => within(item).getByText(/^(First|Second|Third)$/).textContent)).toEqual([
            'Third',
            'Second',
            'First',
        ]);
        expect(within(items[0]).getByText(T.tickets.states.created)).toBeTruthy();
        expect(within(items[0]).getByText(T.tickets.created('2026-11-26'))).toBeTruthy();
        expect(within(items[0]).getByRole('link', { name: T.tickets.issueLink(4) })).toBeTruthy();
        expect(within(items[1]).getByText(T.tickets.states.opened)).toBeTruthy();
        expect(within(items[2]).getByText(T.tickets.states.pending)).toBeTruthy();
    });

    it('lets the player note the link of the issue after opening the GitHub page', () => {
        const storage = seeded();
        show({ storage });
        const item = screen.getByText('Second').closest('li');
        const input = within(item).getByLabelText(T.tickets.linkLabel);
        fireEvent.change(input, { target: { value: 'https://github.com/other/repo/issues/9' } });
        fireEvent.click(within(item).getByRole('button', { name: T.tickets.linkSave }));
        expect(within(item).getByRole('alert').textContent).toBe(T.tickets.linkInvalid);
        expect(input.getAttribute('aria-invalid')).toBe('true');

        fireEvent.change(input, { target: { value: 'https://github.com/owner/game/issues/9' } });
        fireEvent.click(within(item).getByRole('button', { name: T.tickets.linkSave }));
        const second = readTickets(storage).find((record) => record.id === 2);
        expect(second).toMatchObject({
            state: 'created',
            issueUrl: 'https://github.com/owner/game/issues/9',
            issueNumber: 9,
        });
        expect(screen.getByRole('link', { name: T.tickets.issueLink(9) })).toBeTruthy();
    });

    it('cannot send again when no repository is configured', () => {
        show({ storage: seeded(), settings: { bugReportEmail: null, bugReportRepo: null } });
        for (const button of screen.getAllByRole('button', { name: T.tickets.sendAgain })) {
            expect(button.disabled).toBe(true);
        }
    });

    it('opens the GitHub page again for a ticket that was only opened', async () => {
        show({ storage: seeded() });
        const item = screen.getByText('Second').closest('li');
        fireEvent.click(within(item).getByRole('button', { name: T.tickets.sendAgain }));
        expect(await screen.findByText(T.feedback.openedPage)).toBeTruthy();
        expect(new URL(opened[0]).searchParams.get('title')).toBe('Second');
    });
});

describe('sending by e-mail', () => {
    it('opens an e-mail to the contact with the report, after validating the form', () => {
        show();
        press(T.actions.sendMail);
        expect(opened).toEqual([]);
        expect(screen.getByText(T.feedback.invalid)).toBeTruthy();
        fill();
        press(T.actions.sendMail);
        expect(opened).toHaveLength(1);
        const url = new URL(opened[0]);
        expect(url.protocol).toBe('mailto:');
        expect(url.pathname).toBe('support@example.com');
        expect(url.searchParams.get('subject')).toBe('The boss never dies');
        expect(url.searchParams.get('body')).toContain('I hit it ten times.');
        expect(screen.getByText(T.feedback.mailOpened)).toBeTruthy();
    });
});

describe('downloads', () => {
    it('downloads the game file, the save of the three profiles, without sending anything', () => {
        const storage = memoryStorage({
            heroSkills_v23_p1: '{"theme":"spy","skills":{"reading":{"level":4}}}',
            heroProfileNames_v1: JSON.stringify({ 1: 'Robo', 2: 'Player 2', 3: 'Player 3' }),
        });
        show({ storage });
        press(T.attachments.gameFile);
        expect(fetch).not.toHaveBeenCalled();
        expect(opened).toEqual([]);
        expect(downloads).toHaveLength(1);
        expect(downloads[0].filename).toBe('codewash-save-2026-11-26.json');
        expect(downloads[0].data).toMatchObject({
            schema: 'codewash-save-v1',
            exportedAt: '2026-11-26T12:00:00.000Z',
            currentProfile: 1,
            profileNames: { 1: 'Robo' },
            saves: { 1: { theme: 'spy', skills: { reading: { level: 4 } } }, 2: null, 3: null },
        });
        expect(screen.getByText(T.attachments.gameFileSaved)).toBeTruthy();
    });

    it('downloads the full report with the ticket, the error log, the screenshot and the game file', async () => {
        recordError('window', 'boom', 'at somewhere');
        setScreenshotProvider(() => ({
            getStream: async () => ({ getTracks: () => [] }),
            frameToDataUrl: async () => 'data:image/png;base64,AAAA',
        }));
        const { onClose, onOpen } = show();
        press(T.actions.downloadReport);
        expect(downloads).toEqual([]);
        fill({ contact: 'kid@example.com' });
        press(T.attachments.screenshotCapture);
        expect(onClose).toHaveBeenCalledOnce();
        await waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
        press(T.actions.downloadReport);
        expect(downloads).toHaveLength(1);
        const { filename, data } = downloads[0];
        expect(filename).toBe('codewash-bug-report-2026-11-26.json');
        expect(data.schema).toBe('codewash-bug-report-v1');
        expect(data.ticket).toMatchObject({
            title: 'The boss never dies',
            contact: 'kid@example.com',
            errors: [{ source: 'window', message: 'boom', stack: 'at somewhere' }],
            screenshot: { name: 'screenshot-1795694400000.png' },
        });
        expect(data.screenshot.dataUrl).toBe('data:image/png;base64,AAAA');
        expect(data.saveFile.schema).toBe('codewash-save-v1');
        expect(data.issueMarkdown).toContain('## Error log');
        expect(screen.getByText(T.feedback.reportDownloaded)).toBeTruthy();
    });
});

describe('the screenshot', () => {
    const provide = (source) => setScreenshotProvider(() => source);

    it('is captured, shown and can be removed', async () => {
        provide({
            getStream: async () => ({ getTracks: () => [] }),
            frameToDataUrl: async () => 'data:image/png;base64,AAAA',
        });
        show();
        press(T.attachments.screenshotCapture);
        const name = 'screenshot-1795694400000.png';
        expect(await screen.findByText(T.attachments.screenshotAttached(name))).toBeTruthy();
        press(T.attachments.screenshotRemove);
        expect(screen.queryByText(T.attachments.screenshotAttached(name))).toBeNull();
    });

    it.each([
        ['unsupported', () => null],
        [
            'denied',
            () => ({
                getStream: async () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })),
            }),
        ],
        ['failed', () => ({ getStream: async () => Promise.reject(new Error('x')) })],
        [
            'timeout',
            () => ({
                getStream: async () => ({ getTracks: () => [] }),
                frameToDataUrl: () => Promise.reject(Object.assign(new Error('x'), { name: 'TimeoutError' })),
            }),
        ],
    ])('explains a capture that is %s and still reopens the drawer', async (reason, source) => {
        setScreenshotProvider(source);
        const { onOpen } = show();
        press(T.attachments.screenshotCapture);
        expect((await findAlert()).textContent).toBe(T.attachments.screenshotFailed[reason]);
        expect(onOpen).toHaveBeenCalledOnce();
    });

    it('can be an image chosen from the files', async () => {
        show();
        const input = screen.getByLabelText(T.attachments.screenshotChoose);
        fireEvent.change(input, { target: { files: [new File(['abc'], 'bug.png', { type: 'image/png' })] } });
        expect(await screen.findByText(T.attachments.screenshotAttached('bug.png'))).toBeTruthy();
        expect(screen.getByRole('presentation', { hidden: true }).getAttribute('src')).toBe(
            'data:image/png;base64,YWJj',
        );
    });

    it('refuses a file that is not an image', async () => {
        show();
        const input = screen.getByLabelText(T.attachments.screenshotChoose);
        fireEvent.change(input, { target: { files: [new File(['abc'], 'notes.txt', { type: 'text/plain' })] } });
        expect((await findAlert()).textContent).toBe(T.attachments.screenshotFailed.notImage);
    });

    it('does nothing when the file picker is cancelled', () => {
        show();
        fireEvent.change(screen.getByLabelText(T.attachments.screenshotChoose), { target: { files: [] } });
        expect(screen.queryAllByRole('alert')).toEqual([]);
    });

    it('opens the file picker from its button', () => {
        show();
        const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
        press(T.attachments.screenshotChoose);
        expect(click).toHaveBeenCalledOnce();
    });

    it('goes into the ticket as a name only, and the issue tells to attach it by hand only if nothing is private', async () => {
        provide({
            getStream: async () => ({ getTracks: () => [] }),
            frameToDataUrl: async () => 'data:image/png;base64,AAAA',
        });
        const { storage } = show();
        fill();
        press(T.attachments.screenshotCapture);
        await screen.findByText(T.attachments.screenshotAttached('screenshot-1795694400000.png'));
        press(T.actions.createIssue);
        await screen.findByText(T.feedback.openedPage);
        expect(new URL(opened[0]).searchParams.get('body')).toContain(
            ISSUE_TEXTS.screenshotAttached('screenshot-1795694400000.png'),
        );
        expect(storage.data.bugTickets_v1).not.toContain('AAAA');
        expect(screen.queryByText(T.attachments.screenshotAttached('screenshot-1795694400000.png'))).toBeNull();
    });
});

describe('when a link cannot be built or opened', () => {
    it('says so and keeps the ticket for the issue page', async () => {
        setExternalOpener(() => {
            throw new Error('blocked');
        });
        const { storage } = show();
        fill();
        press(T.actions.createIssue);
        expect((await findAlert()).textContent).toBe(T.feedback.linkFailed);
        expect(readTickets(storage)[0].state).toBe('pending');
    });

    it('says so for the e-mail', () => {
        setExternalOpener(() => {
            throw new Error('blocked');
        });
        show();
        fill();
        press(T.actions.sendMail);
        expect(screen.getAllByRole('alert').at(-1).textContent).toBe(T.feedback.linkFailed);
        expect(screen.queryByText(T.feedback.mailOpened)).toBeNull();
    });
});

describe('privacy', () => {
    it('warns, next to the buttons, that the full report and the game file are private', () => {
        show();
        const button = screen.getByRole('button', { name: T.actions.downloadReport });
        const warning = document.getElementById(button.getAttribute('aria-describedby'));
        expect(warning.textContent).toBe(T.actions.reportWarning);
        expect(screen.getByText(T.attachments.gameFileNote)).toBeTruthy();
        expect(screen.getByText(T.attachments.screenshotNote)).toBeTruthy();
    });

    it('puts the warning in the downloaded report too', () => {
        show();
        fill();
        press(T.actions.downloadReport);
        expect(downloads[0].data.privacy).toBe(ISSUE_TEXTS.reportWarning);
    });
});

describe('the GitHub token', () => {
    it('is saved without any space or line break, even inside', () => {
        const { storage } = show();
        fireEvent.change(screen.getByLabelText(T.token.label), {
            target: { value: ` ${FAKE_TOKEN.slice(0, 5)} \n ${FAKE_TOKEN.slice(5)}\r\n` },
        });
        press(T.token.save);
        expect(readGithubToken(storage)).toBe(FAKE_TOKEN);
    });

    it('cannot be saved when it is only spaces', () => {
        show();
        fireEvent.change(screen.getByLabelText(T.token.label), { target: { value: ' \n ' } });
        expect(screen.getByRole('button', { name: T.token.save }).disabled).toBe(true);
    });

    it('says so when the device cannot keep it, and does not pretend it is saved', () => {
        const storage = memoryStorage();
        storage.setItem = () => {
            throw new Error('quota');
        };
        show({ storage });
        fireEvent.change(screen.getByLabelText(T.token.label), { target: { value: FAKE_TOKEN } });
        press(T.token.save);
        expect(screen.getByText(T.token.failed)).toBeTruthy();
        expect(screen.getByText(T.token.none)).toBeTruthy();
        expect(screen.getByLabelText(T.token.label).value).toBe('');
    });

    it('stays saved, and says nothing, when it cannot be removed', () => {
        const storage = memoryStorage({ bugReportGithubToken_v1: FAKE_TOKEN });
        storage.removeItem = () => {
            throw new Error('blocked');
        };
        show({ storage });
        press(T.token.remove);
        expect(screen.getByText(T.token.saved)).toBeTruthy();
    });

    it('is saved on this device only, hidden, and can be removed', () => {
        const { storage } = show();
        const input = screen.getByLabelText(T.token.label);
        expect(input.type).toBe('password');
        expect(screen.getByText(T.token.none)).toBeTruthy();
        expect(screen.getByRole('button', { name: T.token.save }).disabled).toBe(true);
        expect(screen.getByRole('button', { name: T.token.remove }).disabled).toBe(true);

        fireEvent.change(input, { target: { value: `  ${FAKE_TOKEN} ` } });
        press(T.token.save);
        expect(readGithubToken(storage)).toBe(FAKE_TOKEN);
        expect(screen.getByText(T.token.saved)).toBeTruthy();
        expect(input.value).toBe('');
        expect(document.body.innerHTML).not.toContain(FAKE_TOKEN);

        press(T.token.remove);
        expect(readGithubToken(storage)).toBeNull();
        expect(screen.getByText(T.token.none)).toBeTruthy();
    });

    it('is known when the drawer opens', () => {
        const storage = memoryStorage();
        writeGithubToken(storage, FAKE_TOKEN);
        show({ storage });
        expect(screen.getByText(T.token.saved)).toBeTruthy();
    });
});
