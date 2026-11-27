import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HealthDrawer from './HealthDrawer';
import { createCollector } from '../../monitoring/collector';
import * as report from '../../monitoring/report';

let collector;

beforeEach(() => {
    collector = createCollector({ capacity: 3 });
});

afterEach(() => vi.restoreAllMocks());

const open = (props = {}) => render(<HealthDrawer isOpen onClose={() => {}} collector={collector} {...props} />);

describe('HealthDrawer', () => {
    it('is a dialog named after the health of the app, hidden and inert while closed', () => {
        render(<HealthDrawer isOpen={false} onClose={() => {}} collector={collector} />);
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog.getAttribute('aria-label')).toBe('App health');
        expect(dialog.getAttribute('aria-hidden')).toBe('true');
        expect(dialog.hasAttribute('inert')).toBe(true);
        expect(screen.queryByText('Nothing was recorded yet in this session.')).toBeNull();
    });

    it('says that nothing was recorded yet, and tells that nothing leaves the device', () => {
        open();
        expect(screen.getByRole('dialog', { name: 'App health' })).toBeTruthy();
        expect(screen.getByText('Nothing was recorded yet in this session.')).toBeTruthy();
        expect(screen.getByText(/nothing is sent anywhere/)).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Export as JSON' })).toBeNull();
    });

    it('shows a calm summary of the session', () => {
        collector.record('flow', { name: 'app-start' });
        collector.record('error', { errorType: 'TypeError' });
        open();
        expect(screen.getByRole('status').textContent).toContain('Everything looks fine.');
        expect(screen.getByText('TypeError: 1')).toBeTruthy();
        expect(screen.getByText('0 crashes, crash rate 0 per session')).toBeTruthy();
        expect(screen.getByText('App started: 1')).toBeTruthy();
        expect(screen.getByText('2 events recorded')).toBeTruthy();
        expect(screen.getByText('No operation measured.')).toBeTruthy();
        expect(screen.getByText('No battle measured.')).toBeTruthy();
    });

    it('shows the latency of each operation, the frames and the crashes', () => {
        collector.record('latency', { name: 'fetch', durationMs: 120 });
        collector.record('fps', { average: 58, min: 41, samples: 20 });
        collector.record('crash', { errorType: 'RangeError', message: 'boom' });
        open();
        const table = screen.getByRole('table');
        expect(within(table).getByRole('rowheader', { name: 'fetch' })).toBeTruthy();
        expect(
            within(table)
                .getAllByRole('cell')
                .map((cell) => cell.textContent),
        ).toEqual(['1', '120', '120', '0']);
        expect(screen.getByText('Average 58, minimum 41, over 20 seconds')).toBeTruthy();
        expect(screen.getByText('Last crash: RangeError - boom')).toBeTruthy();
        expect(screen.getByText('No key moment recorded.')).toBeTruthy();
        expect(screen.getByText('No error.')).toBeTruthy();
    });

    it('warns and lists the reasons when a ticket is suggested, and offers to report the problem', () => {
        const onReportProblem = vi.fn();
        collector.record('crash', { errorType: 'RangeError', message: 'boom' });
        open({ onReportProblem });
        expect(screen.getByRole('status').textContent).toContain('Something looks wrong.');
        expect(screen.getByText('The app crashed 1 time(s).')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));
        expect(onReportProblem).toHaveBeenCalledTimes(1);
    });

    it('does not offer to report a problem without a place to report it', () => {
        collector.record('crash', { errorType: 'RangeError' });
        open();
        expect(screen.queryByRole('button', { name: 'Report a problem' })).toBeNull();
    });

    it('says how many old events were dropped', () => {
        for (let i = 0; i < 5; i++) collector.record('flow', { name: 'app-start' });
        open();
        expect(screen.getByText('3 events recorded - 2 older events were dropped')).toBeTruthy();
    });

    it('follows the events that arrive while it is open', () => {
        open();
        act(() => {
            collector.record('error', { errorType: 'SyntaxError' });
        });
        expect(screen.getByText('SyntaxError: 1')).toBeTruthy();
    });

    it('exports the events and their summary as a download', () => {
        collector.record('error', { errorType: 'TypeError', message: 'x' });
        const download = vi.spyOn(report, 'downloadReport').mockImplementation(() => {});
        open();
        fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }));
        const json = JSON.parse(download.mock.calls[0][0]);
        expect(json).toMatchObject({ schema: 'codewash-monitoring/1', dropped: 0, summary: { errors: { total: 1 } } });
        expect(json.events).toHaveLength(1);
    });

    it('closes with its button and with Escape, only while open', () => {
        const onClose = vi.fn();
        const { rerender } = open({ onClose });
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(document, { key: 'a' });
        expect(onClose).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(2);
        rerender(<HealthDrawer isOpen={false} onClose={onClose} collector={collector} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
