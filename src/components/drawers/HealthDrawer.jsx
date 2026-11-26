import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { HeartPulse, X } from 'lucide-react';
import { MONITORING_TEXTS, fillText } from '../../constants/monitoringTexts';
import { monitor } from '../../monitoring/monitor';
import { summarize, ticketSuggestionReasons } from '../../monitoring/analysis';
import { downloadReport, exportReportJson } from '../../monitoring/report';

const TEXTS = MONITORING_TEXTS.health;

const Section = ({ title, children }) => (
    <section className="flex flex-col gap-2">
        <h3 className="text-xl font-bold uppercase tracking-wider text-blue-300">{title}</h3>
        {children}
    </section>
);

const HealthContent = ({ collector, onReportProblem }) => {
    const events = useSyncExternalStore(collector.subscribe, collector.getEvents);
    const summary = useMemo(() => summarize(events), [events]);
    const reasons = ticketSuggestionReasons(summary);
    const dropped = collector.getDropped();
    const errorTypes = Object.entries(summary.errors.byType);
    const operations = Object.entries(summary.latency);
    const flows = Object.entries(summary.flows);

    const exportReport = () => downloadReport(exportReportJson({ events, dropped }));

    if (events.length === 0) return <p className="text-lg text-slate-300">{TEXTS.empty}</p>;

    return (
        <div className="flex flex-col gap-6">
            <div
                role="status"
                className={`rounded-lg border-2 p-4 text-lg ${reasons.length > 0 ? 'border-red-500 bg-red-950/60 text-red-200' : 'border-green-600 bg-green-950/40 text-green-200'}`}
            >
                <p className="font-bold">{reasons.length > 0 ? TEXTS.statusAttention : TEXTS.statusGood}</p>
                {reasons.length > 0 && (
                    <ul className="mt-2 list-disc pl-6">
                        {reasons.map((reason, index) => (
                            <li key={`${reason.code}-${index}`}>{fillText(TEXTS.reasons[reason.code], reason)}</li>
                        ))}
                    </ul>
                )}
                {reasons.length > 0 && onReportProblem && (
                    <button
                        onClick={onReportProblem}
                        className="mt-3 rounded border border-red-300 px-3 py-1 font-bold uppercase"
                    >
                        {TEXTS.reportProblem}
                    </button>
                )}
            </div>

            <p className="text-slate-400">
                {fillText(TEXTS.eventCount, { count: summary.eventCount })}
                {dropped > 0 && ` - ${fillText(TEXTS.dropped, { count: dropped })}`}
            </p>

            <Section title={TEXTS.errorsTitle}>
                {errorTypes.length === 0 ? (
                    <p>{TEXTS.errorsNone}</p>
                ) : (
                    <ul>
                        {errorTypes.map(([errorType, count]) => (
                            <li key={errorType}>{fillText(TEXTS.errorsLine, { errorType, count })}</li>
                        ))}
                    </ul>
                )}
            </Section>

            <Section title={TEXTS.crashesTitle}>
                <p>{fillText(TEXTS.crashesLine, { count: summary.crashes.total, rate: summary.crashRate })}</p>
                {summary.crashes.last && <p>{fillText(TEXTS.crashesLast, summary.crashes.last)}</p>}
            </Section>

            <Section title={TEXTS.latencyTitle}>
                {operations.length === 0 ? (
                    <p>{TEXTS.latencyNone}</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th scope="col">{TEXTS.latencyOperation}</th>
                                <th scope="col">{TEXTS.latencyCount}</th>
                                <th scope="col">{TEXTS.latencyP50}</th>
                                <th scope="col">{TEXTS.latencyP95}</th>
                                <th scope="col">{TEXTS.latencyFailures}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operations.map(([name, stats]) => (
                                <tr key={name}>
                                    <th scope="row">{name}</th>
                                    <td>{stats.count}</td>
                                    <td>{stats.p50}</td>
                                    <td>{stats.p95}</td>
                                    <td>{stats.failures}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            <Section title={TEXTS.fpsTitle}>
                <p>{summary.fps ? fillText(TEXTS.fpsLine, summary.fps) : TEXTS.fpsNone}</p>
            </Section>

            <Section title={TEXTS.flowsTitle}>
                {flows.length === 0 ? (
                    <p>{TEXTS.flowsNone}</p>
                ) : (
                    <ul>
                        {flows.map(([name, count]) => (
                            <li key={name}>{fillText(TEXTS.flowsLine, { name: TEXTS.flowNames[name], count })}</li>
                        ))}
                    </ul>
                )}
            </Section>

            <button
                onClick={exportReport}
                className="self-start rounded-lg border-2 border-blue-400 px-4 py-2 text-lg font-bold uppercase text-blue-200 hover:bg-blue-900/50"
            >
                {TEXTS.export}
            </button>
        </div>
    );
};

const HealthDrawer = ({ isOpen, onClose, onReportProblem, collector = monitor }) => {
    useEffect(() => {
        if (!isOpen) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    return (
        <div
            role="dialog"
            aria-label={TEXTS.title}
            aria-hidden={!isOpen}
            inert={!isOpen}
            className={`fixed h-full w-[85%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-l-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ top: 0, right: 0 }}
        >
            <div className="flex h-full flex-col p-6 font-sans text-slate-200">
                <div className="flex shrink-0 items-center justify-between border-b-2 border-slate-700 pb-4">
                    <h2
                        className="flex items-center gap-3 text-4xl font-bold uppercase tracking-widest text-yellow-400"
                        style={{ fontFamily: '"VT323", monospace' }}
                    >
                        <HeartPulse size={32} /> {TEXTS.title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label={TEXTS.close}
                        className="rounded-lg border-2 border-slate-600 p-2 hover:bg-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-6">
                    {isOpen && <HealthContent collector={collector} onReportProblem={onReportProblem} />}
                </div>
                <p className="shrink-0 border-t-2 border-slate-700 pt-3 text-sm text-slate-400">{TEXTS.privacy}</p>
            </div>
        </div>
    );
};

export default HealthDrawer;
