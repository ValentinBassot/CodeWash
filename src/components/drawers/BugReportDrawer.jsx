import React, { memo, useEffect, useRef, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { BUG_REPORT_TEXTS } from '../../constants/bugReportTexts';
import { config } from '../../config';
import { now, todayKey } from '../../domain/clock';
import {
    CATEGORIES,
    LIMITS,
    buildIssuePayload,
    buildIssueUrl,
    buildMailtoUrl,
    buildReport,
    buildSaveFile,
    buildTicket,
    compactTicket,
    validateTicketFields,
} from '../../domain/ticket';
import { downloadJson } from '../../io/download';
import { APP_VERSION, isOnline, openExternal, readEnvironment } from '../../io/environment';
import { getErrorLog } from '../../io/errorLog';
import { createIssue } from '../../io/github';
import { captureScreen, readImageFile } from '../../io/screenshot';
import {
    addTicket,
    browserStorage,
    clearGithubToken,
    readGithubToken,
    readSaveFiles,
    readTickets,
    updateTicket,
    writeGithubToken,
} from '../../persistence/profileStorage';
import BugReportDrawerTickets from './BugReportDrawerTickets';

const T = BUG_REPORT_TEXTS;

const EMPTY_FIELDS = { title: '', description: '', category: 'bug', contact: '' };

const FIELD_ERROR_TEXTS = {
    title: { required: T.validation.titleRequired, tooLong: T.validation.titleTooLong(LIMITS.title) },
    description: {
        required: T.validation.descriptionRequired,
        tooLong: T.validation.descriptionTooLong(LIMITS.description),
    },
    category: { invalid: T.validation.categoryInvalid },
    contact: { invalid: T.validation.contactInvalid, tooLong: T.validation.contactTooLong(LIMITS.contact) },
};

const INPUT_CLASS = 'w-full bg-slate-950 border-2 border-slate-600 rounded px-3 py-2 text-white';
const BUTTON_CLASS =
    'px-4 py-2 rounded-lg border-2 border-slate-500 text-white font-bold hover:bg-slate-700 disabled:opacity-50';

const Field = ({ id, label, error, hint, children }) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-slate-300 font-bold">
            {label}
        </label>
        {children}
        {hint && (
            <p id={`${id}-hint`} className="text-slate-400 text-sm">
                {hint}
            </p>
        )}
        {error && (
            <p id={`${id}-error`} role="alert" className="text-red-400 text-sm">
                {error}
            </p>
        )}
    </div>
);

const BugReportDrawer = ({ isOpen, onClose, onOpen, storage = browserStorage, settings = config }) => {
    const [opened, setOpened] = useState(isOpen);
    const [fields, setFields] = useState(EMPTY_FIELDS);
    const [fieldErrors, setFieldErrors] = useState({});
    const [screenshot, setScreenshot] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [busy, setBusy] = useState(false);
    const [tickets, setTickets] = useState(() => readTickets(storage));
    const [hasToken, setHasToken] = useState(() => readGithubToken(storage) !== null);
    const [tokenDraft, setTokenDraft] = useState('');
    const [tokenFailed, setTokenFailed] = useState(false);
    const titleRef = useRef(null);
    const fileRef = useRef(null);

    if (isOpen && !opened) setOpened(true);

    useEffect(() => {
        if (isOpen) titleRef.current?.focus();
    }, [isOpen]);

    const say = (kind, ...parts) => setFeedback({ kind, text: parts.join(' ') });
    const refreshTickets = () => setTickets(readTickets(storage));
    const setField = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

    const validate = () => {
        const errors = validateTicketFields(fields);
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) return true;
        say('error', T.feedback.invalid);
        return false;
    };

    const makeSaveFile = () => buildSaveFile({ appVersion: APP_VERSION, exportedAt: now(), ...readSaveFiles(storage) });

    const makeTicket = () =>
        buildTicket(fields, {
            now: now(),
            appVersion: APP_VERSION,
            environment: readEnvironment(),
            errors: getErrorLog(),
            saves: readSaveFiles(storage).saves,
            screenshot,
        });

    const sendRecord = async (record) => {
        if (!isOnline()) return { kind: 'error', text: T.feedback.offline };
        const token = readGithubToken(storage);
        if (token) {
            setBusy(true);
            const result = await createIssue({
                repo: settings.bugReportRepo,
                token,
                ...buildIssuePayload(record.ticket),
            });
            setBusy(false);
            if (!result.ok) return { kind: 'error', text: T.feedback.issueFailed[result.reason] };
            updateTicket(storage, record.id, { state: 'created', issueUrl: result.url, issueNumber: result.number });
            return { kind: 'success', text: T.feedback.created(result.number) };
        }
        let truncated;
        try {
            const link = buildIssueUrl(settings.bugReportRepo, record.ticket);
            truncated = link.truncated;
            openExternal(link.url);
        } catch {
            return { kind: 'error', text: T.feedback.linkFailed };
        }
        updateTicket(storage, record.id, { state: 'opened' });
        const cut = truncated.errors || truncated.description;
        return {
            kind: 'info',
            text: cut ? `${T.feedback.openedPage} ${T.feedback.openedTruncated}` : T.feedback.openedPage,
        };
    };

    const sendAgain = async (record) => {
        const outcome = await sendRecord(record);
        refreshTickets();
        say(outcome.kind, outcome.text);
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!settings.bugReportRepo || busy || !validate()) return;
        const ticket = compactTicket(makeTicket());
        const record = addTicket(storage, { state: 'pending', ticket });
        const outcome = await sendRecord(record ?? { id: null, ticket });
        refreshTickets();
        say(outcome.kind, outcome.text, ...(record ? [] : [T.feedback.storageFailed]));
        if (record) {
            setFields(EMPTY_FIELDS);
            setScreenshot(null);
        }
    };

    const downloadReport = () => {
        if (!validate()) return;
        downloadJson(
            `codewash-bug-report-${todayKey()}.json`,
            buildReport(makeTicket(), { screenshot, saveFile: makeSaveFile() }),
        );
        say('success', T.feedback.reportDownloaded);
    };

    const sendMail = () => {
        if (!validate()) return;
        try {
            openExternal(buildMailtoUrl(settings.bugReportEmail, makeTicket()).url);
        } catch {
            say('error', T.feedback.linkFailed);
            return;
        }
        say('info', T.feedback.mailOpened);
    };

    const downloadGameFile = () => {
        downloadJson(`codewash-save-${todayKey()}.json`, makeSaveFile());
        say('success', T.attachments.gameFileSaved);
    };

    const receiveScreenshot = (result) => {
        if (result.ok) {
            setScreenshot(result.screenshot);
            setFeedback(null);
        } else {
            say('error', T.attachments.screenshotFailed[result.reason]);
        }
    };

    const capture = async () => {
        onClose();
        const result = await captureScreen();
        onOpen();
        receiveScreenshot(result);
    };

    const chooseImage = async (event) => {
        const [file] = event.target.files;
        event.target.value = '';
        if (file) receiveScreenshot(await readImageFile(file));
    };

    const cleanToken = tokenDraft.replace(/\s+/g, '');

    const saveToken = () => {
        const saved = writeGithubToken(storage, cleanToken);
        setTokenFailed(!saved);
        if (saved) setHasToken(true);
        setTokenDraft('');
    };

    const removeToken = () => {
        setTokenFailed(false);
        if (clearGithubToken(storage)) setHasToken(false);
    };

    const saveLink = (id, { url, number }) => {
        updateTicket(storage, id, { state: 'created', issueUrl: url, issueNumber: number });
        refreshTickets();
    };

    const errorText = (name) => FIELD_ERROR_TEXTS[name][fieldErrors[name]];
    const errorCount = getErrorLog().length;

    return (
        <div
            role="dialog"
            aria-label={T.drawerLabel}
            aria-hidden={!isOpen}
            inert={!isOpen}
            className={`fixed h-full w-[90%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-l-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ top: 0, right: 0 }}
        >
            {opened && (
                <div className="p-6 h-full flex flex-col text-slate-200 font-sans">
                    <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 shrink-0">
                        <h2
                            className="text-4xl text-yellow-400 font-bold uppercase tracking-widest flex items-center gap-3"
                            style={{ fontFamily: '"VT323", monospace' }}
                        >
                            <Bug size={32} className="text-red-400" /> {T.title}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={T.close}
                            className="p-2 rounded hover:bg-slate-700"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide py-6 flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <p>{T.intro}</p>
                            {settings.bugReportEmail ? (
                                <p>
                                    {T.contact.label}{' '}
                                    <a href={`mailto:${settings.bugReportEmail}`} className="text-blue-300 underline">
                                        {T.contact.mailLink(settings.bugReportEmail)}
                                    </a>
                                </p>
                            ) : (
                                <p className="text-slate-400">{T.contact.none}</p>
                            )}
                            {!settings.bugReportRepo && <p className="text-amber-300">{T.form.noRepository}</p>}
                        </div>

                        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                            <Field id="bug-title" label={T.form.title} error={errorText('title')}>
                                <input
                                    id="bug-title"
                                    ref={titleRef}
                                    value={fields.title}
                                    onChange={setField('title')}
                                    placeholder={T.form.titlePlaceholder}
                                    aria-invalid={Boolean(fieldErrors.title)}
                                    aria-describedby={fieldErrors.title ? 'bug-title-error' : undefined}
                                    className={INPUT_CLASS}
                                />
                            </Field>
                            <Field id="bug-description" label={T.form.description} error={errorText('description')}>
                                <textarea
                                    id="bug-description"
                                    rows={5}
                                    value={fields.description}
                                    onChange={setField('description')}
                                    placeholder={T.form.descriptionPlaceholder}
                                    aria-invalid={Boolean(fieldErrors.description)}
                                    aria-describedby={fieldErrors.description ? 'bug-description-error' : undefined}
                                    className={INPUT_CLASS}
                                />
                            </Field>
                            <Field id="bug-category" label={T.form.category} error={errorText('category')}>
                                <select
                                    id="bug-category"
                                    value={fields.category}
                                    onChange={setField('category')}
                                    className={INPUT_CLASS}
                                >
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {T.categories[category]}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                id="bug-contact"
                                label={T.form.reporterContact}
                                hint={T.form.reporterContactHint}
                                error={errorText('contact')}
                            >
                                <input
                                    id="bug-contact"
                                    type="email"
                                    value={fields.contact}
                                    onChange={setField('contact')}
                                    aria-invalid={Boolean(fieldErrors.contact)}
                                    aria-describedby={
                                        fieldErrors.contact ? 'bug-contact-error bug-contact-hint' : 'bug-contact-hint'
                                    }
                                    className={INPUT_CLASS}
                                />
                            </Field>

                            <fieldset className="flex flex-col gap-3 border-2 border-slate-700 rounded-xl p-4">
                                <legend className="px-2 text-blue-300 font-bold uppercase">
                                    {T.attachments.heading}
                                </legend>
                                <div className="flex gap-3 flex-wrap">
                                    <button type="button" onClick={capture} className={BUTTON_CLASS}>
                                        {T.attachments.screenshotCapture}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current.click()}
                                        className={BUTTON_CLASS}
                                    >
                                        {T.attachments.screenshotChoose}
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        aria-label={T.attachments.screenshotChoose}
                                        onChange={chooseImage}
                                    />
                                </div>
                                {screenshot && (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <img
                                            src={screenshot.dataUrl}
                                            alt=""
                                            className="h-16 border border-slate-600 rounded"
                                        />
                                        <span>{T.attachments.screenshotAttached(screenshot.name)}</span>
                                        <button
                                            type="button"
                                            onClick={() => setScreenshot(null)}
                                            className={BUTTON_CLASS}
                                        >
                                            {T.attachments.screenshotRemove}
                                        </button>
                                    </div>
                                )}
                                <p className="text-slate-400 text-sm">{T.attachments.screenshotNote}</p>
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={downloadGameFile}
                                        className={`${BUTTON_CLASS} self-start`}
                                    >
                                        {T.attachments.gameFile}
                                    </button>
                                    <p className="text-slate-400 text-sm">{T.attachments.gameFileNote}</p>
                                </div>
                                <p className="text-slate-300">{T.attachments.errorLog(errorCount)}</p>
                            </fieldset>

                            <div className="flex gap-3 flex-wrap">
                                <button
                                    type="submit"
                                    disabled={busy || !settings.bugReportRepo}
                                    className="px-4 py-2 rounded-lg border-2 border-yellow-500 bg-yellow-600/30 text-white font-bold hover:bg-yellow-600/50 disabled:opacity-50"
                                >
                                    {busy ? T.actions.creating : T.actions.createIssue}
                                </button>
                                {settings.bugReportEmail && (
                                    <button type="button" onClick={sendMail} className={BUTTON_CLASS}>
                                        {T.actions.sendMail}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={downloadReport}
                                    aria-describedby="bug-report-warning"
                                    className={BUTTON_CLASS}
                                >
                                    {T.actions.downloadReport}
                                </button>
                            </div>
                            <p id="bug-report-warning" className="text-amber-300 text-sm">
                                {T.actions.reportWarning}
                            </p>

                            {feedback && (
                                <p
                                    role={feedback.kind === 'error' ? 'alert' : 'status'}
                                    className={
                                        feedback.kind === 'error'
                                            ? 'text-red-400 font-bold'
                                            : 'text-green-300 font-bold'
                                    }
                                >
                                    {feedback.text}
                                </p>
                            )}
                        </form>

                        <BugReportDrawerTickets
                            tickets={tickets}
                            repo={settings.bugReportRepo}
                            busy={busy}
                            onSendAgain={sendAgain}
                            onSaveLink={saveLink}
                        />

                        <section aria-labelledby="bug-report-token" className="flex flex-col gap-3">
                            <h3
                                id="bug-report-token"
                                className="text-xl text-blue-300 font-bold uppercase tracking-wider"
                            >
                                {T.token.heading}
                            </h3>
                            <p className="text-slate-300">{T.token.explanation}</p>
                            <label htmlFor="bug-token" className="text-slate-300 font-bold">
                                {T.token.label}
                            </label>
                            <input
                                id="bug-token"
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                value={tokenDraft}
                                onChange={(event) => setTokenDraft(event.target.value)}
                                className={INPUT_CLASS}
                            />
                            <div className="flex gap-3 flex-wrap items-center">
                                <button
                                    type="button"
                                    disabled={cleanToken === ''}
                                    onClick={saveToken}
                                    className={BUTTON_CLASS}
                                >
                                    {T.token.save}
                                </button>
                                <button
                                    type="button"
                                    disabled={!hasToken}
                                    onClick={removeToken}
                                    className={BUTTON_CLASS}
                                >
                                    {T.token.remove}
                                </button>
                                <span role="status">{hasToken ? T.token.saved : T.token.none}</span>
                            </div>
                            {tokenFailed && (
                                <p role="alert" className="text-red-400 font-bold">
                                    {T.token.failed}
                                </p>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(BugReportDrawer);
