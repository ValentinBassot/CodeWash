import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCollector } from './collector';
import { resetClock, setClock } from '../domain/clock';

afterEach(resetClock);

describe('createCollector', () => {
    it('stamps each event with an id and the time of its clock', () => {
        let time = 100;
        const collector = createCollector({ clock: () => time });
        collector.record('flow', { name: 'app-start' });
        time = 250;
        collector.record('error', { errorType: 'TypeError' });
        expect(collector.getEvents()).toMatchObject([
            { id: 1, at: 100, type: 'flow' },
            { id: 2, at: 250, type: 'error' },
        ]);
    });

    it('uses the clock of the project by default', () => {
        setClock(() => 777);
        const collector = createCollector();
        expect(collector.now()).toBe(777);
        expect(collector.record('flow', { name: 'app-start' }).at).toBe(777);
    });

    it('refuses what is not an event and keeps nothing of it', () => {
        const collector = createCollector();
        expect(collector.record('nonsense', {})).toBeNull();
        expect(collector.getEvents()).toEqual([]);
    });

    it('keeps the 500 last events by default and counts the dropped ones', () => {
        const collector = createCollector();
        expect(collector.getCapacity()).toBe(500);
        for (let i = 0; i < 503; i++) collector.record('latency', { name: 'op', durationMs: i });
        const events = collector.getEvents();
        expect(events).toHaveLength(500);
        expect(events[0].durationMs).toBe(3);
        expect(events.at(-1).durationMs).toBe(502);
        expect(collector.getDropped()).toBe(3);
    });

    it('is bounded by the given capacity', () => {
        const collector = createCollector({ capacity: 2 });
        ['a', 'b', 'c'].forEach((name) => collector.record('latency', { name }));
        expect(collector.getEvents().map((event) => event.name)).toEqual(['b', 'c']);
    });

    it('gives the same list until something is recorded, and never lets it be changed from outside', () => {
        const collector = createCollector();
        collector.record('flow', { name: 'app-start' });
        const first = collector.getEvents();
        expect(collector.getEvents()).toBe(first);
        first.push('intruder');
        expect(collector.getEvents()).toHaveLength(2);
        collector.record('flow', { name: 'app-start' });
        expect(collector.getEvents()).not.toBe(first);
    });

    it('tells its listeners about each event until they unsubscribe', () => {
        const collector = createCollector();
        const listener = vi.fn();
        const unsubscribe = collector.subscribe(listener);
        const event = collector.record('flow', { name: 'app-start' });
        expect(listener).toHaveBeenCalledWith(event);
        unsubscribe();
        collector.record('flow', { name: 'app-start' });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('clear forgets the events and the dropped count, and tells the listeners', () => {
        const collector = createCollector({ capacity: 1 });
        const listener = vi.fn();
        collector.record('flow', { name: 'app-start' });
        collector.record('flow', { name: 'app-start' });
        collector.subscribe(listener);
        collector.clear();
        expect(collector.getEvents()).toEqual([]);
        expect(collector.getDropped()).toBe(0);
        expect(listener).toHaveBeenCalledWith(null);
    });

    it('still stores and gives the event, and calls the other listeners, when a listener throws', () => {
        const collector = createCollector();
        const after = vi.fn();
        collector.subscribe(() => {
            throw new Error('listener failed');
        });
        collector.subscribe(after);
        const event = collector.record('flow', { name: 'app-start' });
        expect(event).toMatchObject({ type: 'flow' });
        expect(collector.getEvents()).toEqual([event]);
        expect(after).toHaveBeenCalledWith(event);
    });

    it('clear still works when a listener throws', () => {
        const collector = createCollector();
        const after = vi.fn();
        collector.subscribe(() => {
            throw new Error('listener failed');
        });
        collector.subscribe(after);
        expect(() => collector.clear()).not.toThrow();
        expect(after).toHaveBeenCalledWith(null);
    });

    it('never throws: a clock or data that fail give no event', () => {
        const brokenClock = createCollector({
            clock: () => {
                throw new Error('clock');
            },
        });
        expect(brokenClock.record('flow', { name: 'app-start' })).toBeNull();
        expect(brokenClock.getEvents()).toEqual([]);
        const collector = createCollector();
        expect(collector.record('flow', null)).toBeNull();
        expect(collector.record('error', { message: Object.create(null) })).toMatchObject({ message: '' });
    });

    it('notifies the listeners that were subscribed when the event was recorded, even if one unsubscribes another', () => {
        const collector = createCollector();
        const second = vi.fn();
        let unsubscribeSecond;
        collector.subscribe(() => unsubscribeSecond());
        unsubscribeSecond = collector.subscribe(second);
        collector.record('flow', { name: 'app-start' });
        expect(second).toHaveBeenCalledTimes(1);
    });
});
