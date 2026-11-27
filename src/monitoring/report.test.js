import { afterEach, describe, expect, it, vi } from 'vitest';
import { REPORT_SCHEMA, buildReport, downloadReport, exportReportJson, reportFileName } from './report';
import { createCollector } from './collector';
import { resetClock, setClock } from '../domain/clock';

afterEach(resetClock);

const collectorWithEvents = () => {
    setClock(() => Date.parse('2026-11-26T10:00:00Z'));
    const collector = createCollector();
    collector.record('flow', { name: 'app-start' });
    collector.record('error', { errorType: 'TypeError', message: 'x' });
    return collector;
};

describe('buildReport', () => {
    it('joins the summary and the events under a versioned schema', () => {
        const collector = collectorWithEvents();
        const report = buildReport({ events: collector.getEvents(), dropped: 4 });
        expect(report).toMatchObject({
            schema: REPORT_SCHEMA,
            exportedAt: Date.parse('2026-11-26T10:00:00Z'),
            dropped: 4,
            summary: { eventCount: 2, errors: { total: 1 } },
        });
        expect(report.events).toHaveLength(2);
    });

    it('counts no dropped event by default', () => {
        expect(buildReport({ events: [] }).dropped).toBe(0);
    });
});

describe('exportReportJson', () => {
    it('is JSON that reads back to the report', () => {
        const collector = collectorWithEvents();
        const json = exportReportJson({ events: collector.getEvents() });
        expect(JSON.parse(json).events[1]).toMatchObject({ type: 'error', errorType: 'TypeError' });
        expect(json).toContain('\n');
    });
});

describe('reportFileName', () => {
    it('carries the local day', () => {
        setClock(() => Date.parse('2026-11-26T10:00:00Z'));
        expect(reportFileName()).toBe('codewash-health-2026-11-26.json');
    });
});

describe('downloadReport', () => {
    it('gives the JSON as a file download and frees the temporary address', () => {
        setClock(() => Date.parse('2026-11-26T10:00:00Z'));
        const urlApi = { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() };
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            expect(this.download).toBe('codewash-health-2026-11-26.json');
            expect(this.href).toBe('blob:fake');
        });
        downloadReport('{"a":1}', { urlApi });
        expect(urlApi.createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
        expect(click).toHaveBeenCalledTimes(1);
        expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        expect(document.querySelector('a[download]')).toBeNull();
        click.mockRestore();
    });
});
