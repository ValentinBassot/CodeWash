import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { measure, monitor, recordCrash, recordFlow } from './index';
import { resetClock, setClock } from '../domain/clock';

beforeEach(() => monitor.clear());

afterEach(() => {
    monitor.clear();
    resetClock();
});

describe('the monitor of the app', () => {
    it('records a key moment of the flow', () => {
        recordFlow('profile-loaded', { profileId: 2, profileName: 'secret' });
        expect(monitor.getEvents()).toMatchObject([{ type: 'flow', name: 'profile-loaded', detail: { profileId: 2 } }]);
        expect(JSON.stringify(monitor.getEvents())).not.toContain('secret');
    });

    it('records a crash with the error and the component stack', () => {
        recordCrash(new RangeError('too big'), 'at Card');
        expect(monitor.getEvents()).toMatchObject([
            { type: 'crash', errorType: 'RangeError', message: 'too big', componentStack: 'at Card' },
        ]);
    });

    it('records a crash even for a thrown value that is not an error', () => {
        recordCrash(undefined);
        expect(monitor.getEvents()).toMatchObject([{ type: 'crash', errorType: 'Error', message: '' }]);
    });

    it('records a crash even when the error cannot be read', () => {
        const hostile = {
            get name() {
                throw new Error('no');
            },
            get message() {
                throw new Error('no');
            },
        };
        expect(() => recordCrash(hostile)).not.toThrow();
        expect(monitor.getEvents()).toMatchObject([{ type: 'crash', errorType: 'Error', message: '' }]);
    });

    it('records a crash without the text its message quotes', () => {
        recordCrash(new SyntaxError(`Unexpected token 'z', ..."name":"Alice"}" is not valid JSON`));
        expect(JSON.stringify(monitor.getEvents())).not.toContain('Alice');
    });

    it('measures an operation with the replaceable clock', () => {
        let time = 0;
        setClock(() => time);
        measure('slow', () => {
            time += 250;
        });
        expect(monitor.getEvents()).toMatchObject([{ type: 'latency', name: 'slow', durationMs: 250 }]);
    });
});
