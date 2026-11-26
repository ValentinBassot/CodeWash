import { now } from '../domain/clock';
import { cutText } from '../domain/text';

export const MAX_ERROR_ENTRIES = 100;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_STACK_LENGTH = 2000;

let entries = [];
let uninstallCurrent = null;

const cut = (text, max) => {
    const short = cutText(text, max);
    return short === text ? text : `${short}...`;
};

const describe = (value) => {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return Object.prototype.toString.call(value);
    }
};

const safely = (record) => {
    try {
        record();
        return true;
    } catch {
        return false;
    }
};

export const recordError = (source, message, stack = '') => {
    entries.push({
        time: new Date(now()).toISOString(),
        source,
        message: cut(message, MAX_MESSAGE_LENGTH),
        stack: cut(stack, MAX_STACK_LENGTH),
    });
    if (entries.length > MAX_ERROR_ENTRIES) entries = entries.slice(-MAX_ERROR_ENTRIES);
};

export const getErrorLog = () => entries.map((entry) => ({ ...entry }));

export const clearErrorLog = () => {
    entries = [];
};

const stackOf = (value) => (value instanceof Error && value.stack ? value.stack : '');

export const installErrorLog = (target = window, consoleObject = console) => {
    if (uninstallCurrent) return uninstallCurrent;

    const onError = (event) => {
        const error = event.error ?? event.message;
        safely(() => recordError('window', describe(error), stackOf(error)));
    };
    const onRejection = (event) => {
        safely(() => recordError('promise', describe(event.reason), stackOf(event.reason)));
    };
    const originalConsoleError = consoleObject.error;
    const wrappedConsoleError = (...args) => {
        safely(() => {
            const error = args.find((arg) => arg instanceof Error);
            recordError('console', args.map(describe).join(' '), stackOf(error));
        });
        return originalConsoleError.apply(consoleObject, args);
    };

    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onRejection);
    consoleObject.error = wrappedConsoleError;

    uninstallCurrent = () => {
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onRejection);
        if (consoleObject.error === wrappedConsoleError) consoleObject.error = originalConsoleError;
        uninstallCurrent = null;
    };
    return uninstallCurrent;
};
