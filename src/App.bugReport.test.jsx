import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { BUG_REPORT_TEXTS as T } from './constants/bugReportTexts';
import { clearErrorLog, getErrorLog } from './io/errorLog';
import { resetScreenshotProvider, setScreenshotProvider } from './io/screenshot';
import { useGameClock } from './test/game';

const bugButton = () => document.querySelector('button > svg.lucide-bug').closest('button');
const drawer = () => document.querySelector(`[role="dialog"][aria-label="${T.drawerLabel}"]`);
const isOpen = () => !drawer().hasAttribute('inert');
const overlays = () =>
    [...document.querySelectorAll('div.fixed.inset-0')].filter((d) => d.className.includes('bg-black/50'));

beforeEach(() => {
    useGameClock();
    clearErrorLog();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearErrorLog();
    resetScreenshotProvider();
});

describe('the bug report drawer in the game', () => {
    it('opens from the bug button with the form ready, and is closed before', () => {
        render(<App />);
        expect(isOpen()).toBe(false);
        fireEvent.click(bugButton());
        expect(isOpen()).toBe(true);
        expect(screen.getByRole('dialog', { name: T.drawerLabel })).toBeTruthy();
        expect(screen.getByLabelText(T.form.title)).toBeTruthy();
        expect(screen.getByRole('button', { name: T.actions.downloadReport })).toBeTruthy();
    });

    it('closes with Escape, with its close button and by clicking outside', () => {
        render(<App />);
        fireEvent.click(bugButton());
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(isOpen()).toBe(false);

        fireEvent.click(bugButton());
        fireEvent.click(screen.getByRole('button', { name: T.close }));
        expect(isOpen()).toBe(false);

        fireEvent.click(bugButton());
        expect(overlays()).toHaveLength(1);
        fireEvent.click(overlays()[0]);
        expect(isOpen()).toBe(false);
        expect(overlays()).toHaveLength(0);
    });

    it('gives way to the other drawers', () => {
        render(<App />);
        for (const label of ['Open settings', 'Open cosmetics', 'Open achievements']) {
            fireEvent.click(bugButton());
            expect(isOpen()).toBe(true);
            fireEvent.click(screen.getByRole('button', { name: label }));
            expect(isOpen()).toBe(false);
        }
    });

    it('says nothing is configured when the environment has no contact and no repository', () => {
        render(<App />);
        fireEvent.click(bugButton());
        expect(screen.getByText(T.contact.none)).toBeTruthy();
        expect(screen.getByText(T.form.noRepository)).toBeTruthy();
        expect(screen.getByRole('button', { name: T.actions.createIssue }).disabled).toBe(true);
    });

    it('records the errors of the page from the start and counts them in the drawer', () => {
        render(<App />);
        window.dispatchEvent(new ErrorEvent('error', { error: new Error('page broke'), message: 'page broke' }));
        expect(getErrorLog().map((entry) => entry.message)).toContain('page broke');
        fireEvent.click(bugButton());
        expect(screen.getByText(T.attachments.errorLog(getErrorLog().length))).toBeTruthy();
    });

    it('stops recording when the game is closed', () => {
        const before = console.error;
        const { unmount } = render(<App />);
        expect(console.error).not.toBe(before);
        unmount();
        expect(console.error).toBe(before);
    });

    const deferredCapture = () => {
        let finish;
        const frame = new Promise((resolve) => (finish = resolve));
        setScreenshotProvider(() => ({
            getStream: async () => ({ getTracks: () => [] }),
            frameToDataUrl: () => frame,
        }));
        return () => act(async () => finish('data:image/png;base64,AAAA'));
    };

    it('closes during a screen capture, then opens again with the screenshot attached', async () => {
        const finish = deferredCapture();
        render(<App />);
        fireEvent.click(bugButton());
        fireEvent.click(screen.getByRole('button', { name: T.attachments.screenshotCapture }));
        expect(isOpen()).toBe(false);
        await finish();
        expect(isOpen()).toBe(true);
        expect(screen.getByText(/^Screenshot attached: screenshot-/)).toBeTruthy();
    });

    it('does not take the place of a drawer the player opened during the capture', async () => {
        const finish = deferredCapture();
        render(<App />);
        fireEvent.click(bugButton());
        fireEvent.click(screen.getByRole('button', { name: T.attachments.screenshotCapture }));
        fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
        await finish();
        expect(isOpen()).toBe(false);
        expect(document.querySelector('[role="dialog"][aria-label="Settings"]').hasAttribute('inert')).toBe(false);
    });
});
