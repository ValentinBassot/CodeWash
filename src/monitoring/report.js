import { now, todayKey } from '../domain/clock';
import { summarize } from './analysis';

export const REPORT_SCHEMA = 'codewash-monitoring/1';

export const buildReport = ({ events, dropped = 0 }) => ({
    schema: REPORT_SCHEMA,
    exportedAt: now(),
    dropped,
    summary: summarize(events),
    events,
});

export const exportReportJson = (source) => JSON.stringify(buildReport(source), null, 2);

export const reportFileName = () => `codewash-health-${todayKey()}.json`;

export const downloadReport = (json, { doc = document, urlApi = URL } = {}) => {
    const url = urlApi.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = doc.createElement('a');
    link.href = url;
    link.download = reportFileName();
    doc.body.appendChild(link);
    link.click();
    link.remove();
    urlApi.revokeObjectURL(url);
};
