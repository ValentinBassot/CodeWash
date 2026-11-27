import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetClock, setClock } from '../domain/clock';
import {
    MAX_ERROR_ENTRIES,
    MAX_MESSAGE_LENGTH,
    MAX_STACK_LENGTH,
    clearErrorLog,
    getErrorLog,
    installErrorLog,
    recordError,
} from './errorLog';

const NOON = Date.parse('2026-11-26T12:00:00Z');

let uninstall;

beforeEach(() => {
    clearErrorLog();
    setClock(() => NOON);
});

afterEach(() => {
    uninstall?.();
    uninstall = null;
    resetClock();
    clearErrorLog();
});

const fakeTarget = () => {
    const listeners = {};
    return {
        listeners,
        addEventListener: (type, handler) => {
            listeners[type] = handler;
        },
        removeEventListener: (type, handler) => {
            if (listeners[type] === handler) delete listeners[type];
        },
    };
};

const fakeConsole = () => ({ error: vi.fn() });

describe('recordError', () => {
    it('keeps the date from the replaceable clock, the source, the message and the stack', () => {
        recordError('window', 'boom', 'at somewhere');
        expect(getErrorLog()).toEqual([
            { time: '2026-11-26T12:00:00.000Z', source: 'window', message: 'boom', stack: 'at somewhere' },
        ]);
    });

    it('has an empty stack by default', () => {
        recordError('console', 'oops');
        expect(getErrorLog()[0].stack).toBe('');
    });

    it('cuts a long message and a long stack', () => {
        recordError('window', 'm'.repeat(MAX_MESSAGE_LENGTH + 50), 's'.repeat(MAX_STACK_LENGTH + 50));
        const [entry] = getErrorLog();
        expect(entry.message).toBe(`${'m'.repeat(MAX_MESSAGE_LENGTH)}...`);
        expect(entry.stack).toBe(`${'s'.repeat(MAX_STACK_LENGTH)}...`);
    });

    it('keeps only the most recent entries when the buffer is full', () => {
        for (let i = 0; i < MAX_ERROR_ENTRIES + 5; i++) recordError('window', `error ${i}`);
        const log = getErrorLog();
        expect(log).toHaveLength(MAX_ERROR_ENTRIES);
        expect(log[0].message).toBe('error 5');
        expect(log.at(-1).message).toBe(`error ${MAX_ERROR_ENTRIES + 4}`);
    });
});

describe('characters and strange values', () => {
    it('does not cut an emoji in two', () => {
        recordError('window', `${'m'.repeat(MAX_MESSAGE_LENGTH - 1)}😀😀`, `${'s'.repeat(MAX_STACK_LENGTH - 1)}😀😀`);
        const [entry] = getErrorLog();
        expect(entry.message).toBe(`${'m'.repeat(MAX_MESSAGE_LENGTH - 1)}😀...`);
        expect(entry.stack).toBe(`${'s'.repeat(MAX_STACK_LENGTH - 1)}😀...`);
        expect(() => encodeURIComponent(entry.message + entry.stack)).not.toThrow();
    });

    it('describes a circular object that has no prototype', () => {
        const consoleObject = fakeConsole();
        uninstall = installErrorLog(fakeTarget(), consoleObject);
        const strange = Object.create(null);
        strange.self = strange;
        consoleObject.error(strange);
        expect(getErrorLog()[0].message).toBe('[object Object]');
    });

    it('never stops console.error or the page when recording fails', () => {
        const target = fakeTarget();
        const consoleObject = fakeConsole();
        const original = consoleObject.error;
        uninstall = installErrorLog(target, consoleObject);
        setClock(() => {
            throw new Error('clock broken');
        });
        expect(() => consoleObject.error('still printed')).not.toThrow();
        expect(original).toHaveBeenCalledWith('still printed');
        expect(() => target.listeners.error({ error: new Error('x') })).not.toThrow();
        expect(() => target.listeners.unhandledrejection({ reason: 'x' })).not.toThrow();
        expect(getErrorLog()).toEqual([]);
    });
});

describe('getErrorLog and clearErrorLog', () => {
    it('returns copies that cannot change the log', () => {
        recordError('window', 'boom');
        getErrorLog()[0].message = 'changed';
        expect(getErrorLog()[0].message).toBe('boom');
    });

    it('empties the log', () => {
        recordError('window', 'boom');
        clearErrorLog();
        expect(getErrorLog()).toEqual([]);
    });
});

describe('installErrorLog', () => {
    it('records the errors of the page with their stack', () => {
        const target = fakeTarget();
        uninstall = installErrorLog(target, fakeConsole());
        const error = new Error('page broke');
        target.listeners.error({ error, message: 'ignored' });
        expect(getErrorLog()[0]).toMatchObject({ source: 'window', message: 'page broke' });
        expect(getErrorLog()[0].stack).toContain('page broke');
    });

    it('falls back to the message of an error event without an error object', () => {
        const target = fakeTarget();
        uninstall = installErrorLog(target, fakeConsole());
        target.listeners.error({ error: null, message: 'Script error.' });
        expect(getErrorLog()[0]).toMatchObject({ source: 'window', message: 'Script error.', stack: '' });
    });

    it('records the unhandled promise rejections, whatever the reason', () => {
        const target = fakeTarget();
        uninstall = installErrorLog(target, fakeConsole());
        target.listeners.unhandledrejection({ reason: new Error('late') });
        target.listeners.unhandledrejection({ reason: 'plain text' });
        target.listeners.unhandledrejection({ reason: { code: 7 } });
        target.listeners.unhandledrejection({ reason: undefined });
        const messages = getErrorLog().map((entry) => entry.message);
        expect(messages).toEqual(['late', 'plain text', '{"code":7}', 'undefined']);
        expect(getErrorLog().every((entry) => entry.source === 'promise')).toBe(true);
    });

    it('describes a reason that cannot be turned into JSON', () => {
        const target = fakeTarget();
        uninstall = installErrorLog(target, fakeConsole());
        const circular = {};
        circular.self = circular;
        target.listeners.unhandledrejection({ reason: circular });
        expect(getErrorLog()[0].message).toBe('[object Object]');
    });

    it('records console.error and still calls the original', () => {
        const target = fakeTarget();
        const consoleObject = fakeConsole();
        const original = consoleObject.error;
        uninstall = installErrorLog(target, consoleObject);
        const cause = new Error('inner');
        consoleObject.error('Saved profile unreadable:', cause, 42);
        expect(original).toHaveBeenCalledWith('Saved profile unreadable:', cause, 42);
        expect(getErrorLog()[0]).toMatchObject({ source: 'console', message: 'Saved profile unreadable: inner 42' });
        expect(getErrorLog()[0].stack).toContain('inner');
    });

    it('records console.error without an Error as a message with no stack', () => {
        const consoleObject = fakeConsole();
        uninstall = installErrorLog(fakeTarget(), consoleObject);
        consoleObject.error('just text');
        expect(getErrorLog()[0]).toMatchObject({ message: 'just text', stack: '' });
    });

    it('ignores the stack of an error that has none', () => {
        const consoleObject = fakeConsole();
        uninstall = installErrorLog(fakeTarget(), consoleObject);
        const error = new Error('no stack');
        error.stack = '';
        consoleObject.error(error);
        expect(getErrorLog()[0].stack).toBe('');
    });

    it('is installed once: a second call changes nothing', () => {
        const target = fakeTarget();
        const consoleObject = fakeConsole();
        uninstall = installErrorLog(target, consoleObject);
        const wrapped = consoleObject.error;
        expect(installErrorLog(target, consoleObject)).toBe(uninstall);
        expect(consoleObject.error).toBe(wrapped);
    });

    it('stops recording and gives console.error back when uninstalled', () => {
        const target = fakeTarget();
        const consoleObject = fakeConsole();
        const original = consoleObject.error;
        installErrorLog(target, consoleObject)();
        expect(target.listeners).toEqual({});
        expect(consoleObject.error).toBe(original);
        const again = installErrorLog(target, consoleObject);
        again();
    });

    it('leaves console.error alone when someone else replaced it meanwhile', () => {
        const consoleObject = fakeConsole();
        const stop = installErrorLog(fakeTarget(), consoleObject);
        const other = vi.fn();
        consoleObject.error = other;
        stop();
        expect(consoleObject.error).toBe(other);
    });

    it('listens to the real window and the real console by default', () => {
        const silenced = vi.spyOn(console, 'error').mockImplementation(() => {});
        uninstall = installErrorLog();
        window.dispatchEvent(new ErrorEvent('error', { error: new Error('real window'), message: 'real window' }));
        console.error('real console');
        expect(getErrorLog().map((entry) => entry.message)).toEqual(['real window', 'real console']);
        uninstall();
        uninstall = null;
        silenced.mockRestore();
    });
});
