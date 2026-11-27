import { now } from '../domain/clock';
import { attempt } from './safe';
import { buildEvent } from './events';

export const DEFAULT_CAPACITY = 500;

export const createCollector = ({ capacity = DEFAULT_CAPACITY, clock = now } = {}) => {
    let events = [];
    let snapshot = [];
    let dropped = 0;
    let sequence = 0;
    const listeners = new Set();

    const store = (type, data) => {
        const built = buildEvent(type, data);
        if (!built) return null;
        const event = { id: ++sequence, at: clock(), ...built };
        events.push(event);
        if (events.length > capacity) {
            events.shift();
            dropped += 1;
        }
        snapshot = [...events];
        return event;
    };

    const record = (type, data) => {
        const event = attempt(() => store(type, data));
        if (event) [...listeners].forEach((listener) => attempt(() => listener(event)));
        return event;
    };

    const clear = () => {
        events = [];
        snapshot = [];
        dropped = 0;
        [...listeners].forEach((listener) => attempt(() => listener(null)));
    };

    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    return {
        record,
        clear,
        subscribe,
        now: () => clock(),
        getEvents: () => snapshot,
        getDropped: () => dropped,
        getCapacity: () => capacity,
    };
};
