import React, { useState } from 'react';
import { BUG_REPORT_TEXTS } from '../../constants/bugReportTexts';
import { parseIssueLink } from '../../domain/ticket';

const T = BUG_REPORT_TEXTS.tickets;

const TicketItem = ({ record, repo, busy, onSendAgain, onSaveLink }) => {
    const [linkDraft, setLinkDraft] = useState('');
    const [linkInvalid, setLinkInvalid] = useState(false);

    const saveLink = () => {
        const parsed = parseIssueLink(repo, linkDraft);
        setLinkInvalid(parsed === null);
        if (parsed === null) return;
        onSaveLink(record.id, parsed);
        setLinkDraft('');
    };

    return (
        <li className="bg-slate-900/60 border-2 border-slate-600 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between gap-3 flex-wrap">
                <strong className="text-white break-words">{record.ticket.title}</strong>
                <span className="text-slate-400 text-sm">{T.created(record.ticket.createdAt.slice(0, 10))}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-yellow-300 font-bold uppercase">{T.states[record.state]}</span>
                {record.issueUrl && (
                    <a
                        href={record.issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 underline"
                    >
                        {T.issueLink(record.issueNumber)}
                    </a>
                )}
            </div>
            {record.state !== 'created' && (
                <button
                    type="button"
                    disabled={busy || !repo}
                    onClick={() => onSendAgain(record)}
                    className="self-start px-3 py-1 rounded border-2 border-slate-500 text-white font-bold hover:bg-slate-700 disabled:opacity-50"
                >
                    {T.sendAgain}
                </button>
            )}
            {record.state === 'opened' && (
                <div className="flex flex-col gap-1">
                    <label htmlFor={`issue-link-${record.id}`} className="text-slate-300 text-sm">
                        {T.linkLabel}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        <input
                            id={`issue-link-${record.id}`}
                            value={linkDraft}
                            onChange={(event) => setLinkDraft(event.target.value)}
                            aria-invalid={linkInvalid}
                            className="flex-1 min-w-0 bg-slate-950 border-2 border-slate-600 rounded px-2 py-1 text-white"
                        />
                        <button
                            type="button"
                            onClick={saveLink}
                            className="px-3 py-1 rounded border-2 border-slate-500 text-white font-bold hover:bg-slate-700"
                        >
                            {T.linkSave}
                        </button>
                    </div>
                    {linkInvalid && (
                        <p role="alert" className="text-red-400 text-sm">
                            {T.linkInvalid}
                        </p>
                    )}
                </div>
            )}
        </li>
    );
};

const BugReportDrawerTickets = ({ tickets, repo, busy, onSendAgain, onSaveLink }) => (
    <section aria-labelledby="bug-report-tickets">
        <h3 id="bug-report-tickets" className="text-xl text-blue-300 mb-3 font-bold uppercase tracking-wider">
            {T.heading}
        </h3>
        {tickets.length === 0 ? (
            <p className="text-slate-400">{T.empty}</p>
        ) : (
            <ul className="flex flex-col gap-3">
                {[...tickets].reverse().map((record) => (
                    <TicketItem
                        key={record.id}
                        record={record}
                        repo={repo}
                        busy={busy}
                        onSendAgain={onSendAgain}
                        onSaveLink={onSaveLink}
                    />
                ))}
            </ul>
        )}
    </section>
);

export default BugReportDrawerTickets;
