import { describe, expect, it } from 'vitest';
import { buildEvent, describeError, sanitizeMessage } from './events';

describe('buildEvent', () => {
    it('refuses an unknown type', () => {
        expect(buildEvent('spy', {})).toBeNull();
    });

    it('refuses a flow without a known name', () => {
        expect(buildEvent('flow', { name: 'whatever' })).toBeNull();
        expect(buildEvent('flow')).toBeNull();
    });

    it('builds an error with defaults and a known origin', () => {
        expect(buildEvent('error')).toEqual({ type: 'error', errorType: 'Error', message: '', origin: 'window' });
        expect(buildEvent('error', { errorType: 'TypeError', message: 'x', origin: 'promise' })).toEqual({
            type: 'error',
            errorType: 'TypeError',
            message: 'x',
            origin: 'promise',
        });
        expect(buildEvent('error', { origin: 'elsewhere' }).origin).toBe('window');
    });

    it('cleans the message of an error and of a crash before keeping it', () => {
        const message = `Unexpected token 'z', ..."name":"Alice"}" is not valid JSON`;
        expect(buildEvent('error', { message }).message).toBe('Unexpected token ,');
        expect(buildEvent('crash', { message }).message).toBe('Unexpected token ,');
    });

    it('turns a message that is not a text into a text, and cuts the long ones', () => {
        expect(buildEvent('error', { message: 42 }).message).toBe('42');
        expect(buildEvent('error', { message: 'a'.repeat(500) }).message).toHaveLength(200);
        expect(buildEvent('error', { errorType: 'E'.repeat(500) }).errorType).toHaveLength(60);
    });

    it('builds a crash with the component stack cut at 500 characters', () => {
        const crash = buildEvent('crash', {
            errorType: 'RangeError',
            message: 'boom',
            componentStack: 's'.repeat(900),
        });
        expect(crash).toMatchObject({ type: 'crash', errorType: 'RangeError', message: 'boom' });
        expect(crash.componentStack).toHaveLength(500);
        expect(buildEvent('crash').componentStack).toBe('');
    });

    it('builds a latency with a rounded positive duration and an ok flag', () => {
        expect(buildEvent('latency', { name: 'fetch', durationMs: 12.34 })).toEqual({
            type: 'latency',
            name: 'fetch',
            durationMs: 12.3,
            ok: true,
        });
        expect(buildEvent('latency', { name: 'x', durationMs: 5, ok: false }).ok).toBe(false);
        expect(buildEvent('latency', { durationMs: -4 })).toMatchObject({ name: 'unknown', durationMs: 0 });
        expect(buildEvent('latency', { name: 'x', durationMs: NaN }).durationMs).toBe(0);
    });

    it('builds an fps sample', () => {
        expect(buildEvent('fps', { average: 59.96, min: 40, samples: 10 })).toEqual({
            type: 'fps',
            average: 60,
            min: 40,
            samples: 10,
        });
    });

    it('keeps only the allowed detail keys of a flow, with plain values only', () => {
        const flow = buildEvent('flow', {
            name: 'battle-start',
            detail: { skillId: 'math', profileName: 'Eliott', nested: { a: 1 }, outcome: 3, reason: NaN, drawer: {} },
        });
        expect(flow).toEqual({ type: 'flow', name: 'battle-start', detail: { skillId: 'math', outcome: 3 } });
        expect(buildEvent('flow', { name: 'app-start' }).detail).toEqual({});
    });

    it('rejects a text value that is not a known word or a plain identifier', () => {
        const detail = (values) => buildEvent('flow', { name: 'drawer-open', detail: values }).detail;
        expect(detail({ reason: 'Alice' })).toEqual({});
        expect(detail({ reason: 'network', outcome: 'death', drawer: 'health' })).toEqual({
            reason: 'network',
            outcome: 'death',
            drawer: 'health',
        });
        expect(detail({ skillId: 'Alice Smith' })).toEqual({});
        expect(detail({ skillId: 'memory-2' })).toEqual({ skillId: 'memory-2' });
        expect(detail({ skillId: 'd'.repeat(100) })).toEqual({});
        expect(detail({ skillId: '' })).toEqual({});
        expect(detail({ difficulty: 'a"b' })).toEqual({});
    });

    it('keeps numbers and booleans of a detail, and survives a detail that throws', () => {
        const detail = (values) => buildEvent('flow', { name: 'drawer-open', detail: values }).detail;
        expect(detail({ profileId: 2, difficulty: true })).toEqual({ profileId: 2, difficulty: true });
        const hostile = {
            get skillId() {
                throw new Error('no');
            },
        };
        expect(detail(hostile)).toEqual({});
    });

    it('survives values that cannot be turned into a text', () => {
        const noPrototype = Object.create(null);
        const angry = {
            toString: () => {
                throw new Error('no');
            },
        };
        expect(buildEvent('error', { message: noPrototype, errorType: angry })).toMatchObject({
            errorType: 'Error',
            message: '',
        });
        expect(buildEvent('latency', { name: noPrototype, durationMs: noPrototype })).toMatchObject({
            name: 'unknown',
            durationMs: 0,
        });
        expect(buildEvent('fps', { average: Symbol('x') }).average).toBe(0);
    });
});

describe('sanitizeMessage', () => {
    it('removes the fragment of a save quoted by JSON.parse', () => {
        const message = `Unexpected token 'z', ..."name":"Alice","hp":zzz}" is not valid JSON`;
        const clean = sanitizeMessage(message);
        expect(clean).toBe('Unexpected token ,');
        expect(clean).not.toContain('Alice');
    });

    it('removes the text between quotes and back quotes, and an unclosed quote with what follows', () => {
        expect(sanitizeMessage(`Cannot read properties of undefined (reading 'Alice')`)).toBe(
            'Cannot read properties of undefined (reading )',
        );
        expect(sanitizeMessage('bad "Alice" and `Bob` here')).toBe('bad and here');
        expect(sanitizeMessage(`Unexpected end of "Alice`)).toBe('Unexpected end of');
        expect(sanitizeMessage(`it's Alice`)).toBe('it');
    });

    it('keeps the start of an ordinary message, in one line, and bounds it', () => {
        expect(sanitizeMessage('x is\n   not a function')).toBe('x is not a function');
        expect(sanitizeMessage('a'.repeat(500))).toHaveLength(200);
        expect(sanitizeMessage('a'.repeat(500), 10)).toHaveLength(10);
        expect(sanitizeMessage(undefined)).toBe('');
        expect(sanitizeMessage(Object.create(null))).toBe('');
    });
});

describe('describeError', () => {
    it('gives the type and the cleaned message of an error', () => {
        expect(describeError(new TypeError("bad 'Alice'"))).toEqual({ errorType: 'TypeError', message: 'bad' });
    });

    it('falls back for what is not an error, or an error that throws when read', () => {
        expect(describeError(undefined)).toEqual({ errorType: 'Error', message: '' });
        expect(describeError('plain')).toEqual({ errorType: 'Error', message: '' });
        const hostile = {
            get name() {
                throw new Error('no');
            },
        };
        expect(describeError(hostile)).toEqual({ errorType: 'Error', message: '' });
    });
});
