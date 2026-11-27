import { ISSUE_TEXTS } from '../constants/bugReportTexts';
import { countChars, cutText, wellFormed } from './text';

export const CATEGORIES = ['bug', 'crash', 'display', 'audio', 'voice', 'other'];
export const TICKET_STATES = ['pending', 'opened', 'created'];
export const LIMITS = { title: 120, description: 4000, contact: 200 };
export const MAX_ISSUE_ERRORS = 20;
export const STORED_STACK_LENGTH = 600;
export const ISSUE_URL_LIMIT = 7000;
export const MAILTO_LIMIT = 1800;
export const REPORT_SCHEMA = 'codewash-bug-report-v1';
export const SAVE_FILE_SCHEMA = 'codewash-save-v1';
export const DEFAULT_THEME = 'minecraft';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateTicketFields = ({ title, description, category, contact }) => {
    const errors = {};
    const cleanTitle = (title ?? '').trim();
    const cleanDescription = (description ?? '').trim();
    const cleanContact = (contact ?? '').trim();
    if (cleanTitle === '') errors.title = 'required';
    else if (cleanTitle.length > LIMITS.title) errors.title = 'tooLong';
    if (cleanDescription === '') errors.description = 'required';
    else if (cleanDescription.length > LIMITS.description) errors.description = 'tooLong';
    if (!CATEGORIES.includes(category)) errors.category = 'invalid';
    if (cleanContact.length > LIMITS.contact) errors.contact = 'tooLong';
    else if (cleanContact !== '' && !EMAIL.test(cleanContact)) errors.contact = 'invalid';
    return errors;
};

export const isValidTicket = (fields) => Object.keys(validateTicketFields(fields)).length === 0;

export const summarizeSave = (saves) => {
    const values = Object.values(saves);
    const readable = values.filter((save) => save !== null && typeof save === 'object');
    const themes = readable.map((save) => (typeof save.theme === 'string' ? save.theme : DEFAULT_THEME));
    return {
        profilesWithSave: readable.length,
        unreadableSaves: values.filter((save) => typeof save === 'string').length,
        themes: [...new Set(themes)].sort(),
    };
};

export const buildTicket = (fields, context) => ({
    title: fields.title.trim(),
    description: fields.description.trim(),
    category: fields.category,
    contact: (fields.contact ?? '').trim(),
    createdAt: new Date(context.now).toISOString(),
    appVersion: context.appVersion,
    environment: context.environment,
    errors: context.errors,
    saveSummary: summarizeSave(context.saves),
    screenshot: context.screenshot ? { name: context.screenshot.name, type: context.screenshot.type } : null,
});

export const compactTicket = (ticket) => ({
    ...ticket,
    errors: ticket.errors.slice(-MAX_ISSUE_ERRORS).map((entry) => ({
        ...entry,
        stack: cutText(entry.stack, STORED_STACK_LENGTH),
    })),
});

const FENCE = '```';

const defuse = (text) => text.replaceAll(FENCE, "'''");

const MAX_LOG_TEXT = 200;
const MAX_STACK_LINES = 6;
const QUOTED = /"[^"]*"|`[^`]*`|(?<![\p{L}\p{N}])'[^']*'/gu;
const PATH_PREFIX = /(?<=^|[\s(@=])(?:[A-Za-z][\w+.-]*:\/\/[^\\/\s()]*)?(?:[A-Za-z]:)?(?:[\\/][^\\/\s()]*)*[\\/]/gu;

const JSON_ERROR = /^([^'"`]*?)\s*['"`].*\bis not valid JSON\b/su;

export const cleanLogText = (text) => {
    const [beforeFragment] = text
        .replace(JSON_ERROR, (_whole, head) => `${head} ${ISSUE_TEXTS.removed} is not valid JSON`)
        .split('...');
    const withoutQuotes = beforeFragment.replace(QUOTED, ISSUE_TEXTS.removed);
    return cutText(withoutQuotes.replace(PATH_PREFIX, '').trim(), MAX_LOG_TEXT);
};

const errorLines = (entry) => {
    const stackLines = entry.stack === '' ? [] : entry.stack.split('\n').slice(0, MAX_STACK_LINES).map(cleanLogText);
    return [`[${entry.time}] ${entry.source}: ${cleanLogText(entry.message)}`, ...stackLines].join('\n');
};

const describeEnvironment = (environment) =>
    `${environment.runtime}, ${environment.language}, ${environment.viewport} (${environment.userAgent})`;

const errorSection = (ticket, shown) => {
    const total = ticket.errors.length;
    if (total === 0) return [`## ${ISSUE_TEXTS.errorLog}`, '', ISSUE_TEXTS.errorLogEmpty];
    const lines = [`## ${ISSUE_TEXTS.errorLog}`, '', ISSUE_TEXTS.errorLogShown(shown, total)];
    if (shown < total) lines.push('', ISSUE_TEXTS.errorLogCut);
    if (shown > 0) {
        const text = ticket.errors.slice(-shown).map(errorLines).join('\n\n');
        lines.push('', `${FENCE}text`, defuse(text), FENCE);
    }
    return lines;
};

export const issueBody = (ticket, options = {}) => {
    const shown = Math.min(options.errorCount ?? MAX_ISSUE_ERRORS, MAX_ISSUE_ERRORS, ticket.errors.length);
    const limit = options.descriptionLimit ?? Infinity;
    const cutDescription = countChars(ticket.description) > limit;
    const description = cutDescription ? cutText(ticket.description, limit) : ticket.description;
    const { saveSummary } = ticket;
    const lines = [
        `## ${ISSUE_TEXTS.description}`,
        '',
        description,
        ...(cutDescription ? ['', ISSUE_TEXTS.descriptionCut] : []),
        '',
        `## ${ISSUE_TEXTS.details}`,
        '',
        `- ${ISSUE_TEXTS.category}: ${ticket.category}`,
        `- ${ISSUE_TEXTS.reported}: ${ticket.createdAt}`,
        `- ${ISSUE_TEXTS.appVersion}: ${ticket.appVersion}`,
        `- ${ISSUE_TEXTS.environment}: ${describeEnvironment(ticket.environment)}`,
        `- ${ISSUE_TEXTS.screenshot}: ${ticket.screenshot ? ISSUE_TEXTS.screenshotAttached(ticket.screenshot.name) : ISSUE_TEXTS.screenshotNone}`,
        `- ${ISSUE_TEXTS.contact}: ${ticket.contact === '' ? ISSUE_TEXTS.contactNone : ISSUE_TEXTS.contactLeft}`,
        '',
        `## ${ISSUE_TEXTS.saveSummary}`,
        '',
        `- ${ISSUE_TEXTS.profilesWithSave(saveSummary.profilesWithSave)}`,
        `- ${ISSUE_TEXTS.themes}: ${saveSummary.themes.length === 0 ? ISSUE_TEXTS.themesNone : saveSummary.themes.join(', ')}`,
        `- ${ISSUE_TEXTS.unreadableSaves}: ${saveSummary.unreadableSaves}`,
        '',
        ...errorSection(ticket, shown),
    ];
    return `${lines.join('\n')}\n`;
};

export const issueUrlFor = (repo) => (title, body) =>
    `https://github.com/${repo}/issues/new?title=${encodeURIComponent(wellFormed(title))}&body=${encodeURIComponent(wellFormed(body))}`;

export const mailtoUrlFor = (email, extra) => (title, body) =>
    `mailto:${email}?subject=${encodeURIComponent(wellFormed(title))}&body=${encodeURIComponent(wellFormed(`${body}${extra}`))}`;

function* shrinkingOptions(ticket) {
    for (let count = Math.min(ticket.errors.length, MAX_ISSUE_ERRORS); count >= 0; count--) {
        yield { errorCount: count, descriptionLimit: Infinity };
    }
    for (let limit = Math.floor(countChars(ticket.description) * 0.8); limit > 0; limit = Math.floor(limit * 0.8)) {
        yield { errorCount: 0, descriptionLimit: limit };
    }
    yield { errorCount: 0, descriptionLimit: 0 };
}

export const fitToLink = (ticket, limit, makeUrl) => {
    let last = null;
    for (const options of shrinkingOptions(ticket)) {
        last = {
            url: makeUrl(ticket.title, issueBody(ticket, options)),
            truncated: {
                errors: options.errorCount < ticket.errors.length,
                description: options.descriptionLimit < countChars(ticket.description),
            },
        };
        if (last.url.length <= limit) break;
    }
    return last;
};

export const buildIssueUrl = (repo, ticket, limit = ISSUE_URL_LIMIT) => fitToLink(ticket, limit, issueUrlFor(repo));

export const buildMailtoUrl = (email, ticket, limit = MAILTO_LIMIT) =>
    fitToLink(
        ticket,
        limit,
        mailtoUrlFor(email, ticket.contact === '' ? '' : `\n${ISSUE_TEXTS.mailContact(ticket.contact)}\n`),
    );

export const buildIssuePayload = (ticket) => ({ title: ticket.title, body: issueBody(ticket) });

export const buildReport = (ticket, { screenshot = null, saveFile = null } = {}) => ({
    schema: REPORT_SCHEMA,
    ticket,
    privacy: ISSUE_TEXTS.reportWarning,
    issueMarkdown: issueBody(ticket),
    screenshot,
    saveFile,
});

export const buildSaveFile = ({ appVersion, exportedAt, currentProfile, profileNames, saves }) => ({
    schema: SAVE_FILE_SCHEMA,
    appVersion,
    exportedAt: new Date(exportedAt).toISOString(),
    currentProfile,
    profileNames,
    saves,
});

export const parseIssueLink = (repo, text) => {
    let url;
    try {
        url = new URL((text ?? '').trim());
    } catch {
        return null;
    }
    const [owner, name, section, number, ...rest] = url.pathname.split('/').filter(Boolean);
    const sameRepo = `${owner}/${name}`.toLowerCase() === repo.toLowerCase();
    const isIssue = url.protocol === 'https:' && url.hostname === 'github.com' && section === 'issues';
    if (!sameRepo || !isIssue || !/^[1-9]\d*$/.test(number ?? '') || rest.length > 0) return null;
    return { url: `https://github.com/${repo}/issues/${number}`, number: Number(number) };
};
