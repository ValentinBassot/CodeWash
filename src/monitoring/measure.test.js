import { describe, expect, it } from 'vitest';
import { createCollector } from './collector';
import { measureWith } from './measure';

const setup = () => {
    const time = { value: 0 };
    return { time, collector: createCollector({ clock: () => time.value }) };
};

describe('measureWith', () => {
    it('measures a synchronous operation and gives its result back', () => {
        const { time, collector } = setup();
        const result = measureWith(collector, 'compute', () => {
            time.value += 30;
            return 'done';
        });
        expect(result).toBe('done');
        expect(collector.getEvents()).toMatchObject([{ type: 'latency', name: 'compute', durationMs: 30, ok: true }]);
    });

    it('records a failure of a synchronous operation and lets it go through', () => {
        const { time, collector } = setup();
        expect(() =>
            measureWith(collector, 'compute', () => {
                time.value += 5;
                throw new Error('bad');
            }),
        ).toThrow('bad');
        expect(collector.getEvents()).toMatchObject([{ name: 'compute', durationMs: 5, ok: false }]);
    });

    it('measures an asynchronous operation until it resolves', async () => {
        const { time, collector } = setup();
        const value = await measureWith(collector, 'fetch', async () => {
            time.value += 120;
            return 42;
        });
        expect(value).toBe(42);
        expect(collector.getEvents()).toMatchObject([{ name: 'fetch', durationMs: 120, ok: true }]);
    });

    it('records a rejection and passes it on', async () => {
        const { time, collector } = setup();
        await expect(
            measureWith(collector, 'fetch', async () => {
                time.value += 80;
                throw new Error('offline');
            }),
        ).rejects.toThrow('offline');
        expect(collector.getEvents()).toMatchObject([{ name: 'fetch', durationMs: 80, ok: false }]);
    });
});
