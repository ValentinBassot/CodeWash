import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    APP_VERSION,
    isOnline,
    openExternal,
    readEnvironment,
    resetExternalOpener,
    setExternalOpener,
} from './environment';

afterEach(() => {
    resetExternalOpener();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('APP_VERSION', () => {
    it('is the version of the package', () => {
        expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    });
});

describe('readEnvironment', () => {
    it('describes the browser, read at call time', () => {
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120', language: 'en-US' });
        vi.stubGlobal('innerWidth', 800);
        vi.stubGlobal('innerHeight', 600);
        expect(readEnvironment()).toEqual({
            runtime: 'Browser',
            userAgent: 'Mozilla/5.0 Chrome/120',
            language: 'en-US',
            viewport: '800x600',
        });
    });

    it('recognizes the Electron app', () => {
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Electron/39.0.0 Chrome/140', language: 'fr' });
        expect(readEnvironment().runtime).toBe('Electron');
    });
});

describe('isOnline', () => {
    it('follows the browser', () => {
        vi.stubGlobal('navigator', { onLine: false });
        expect(isOnline()).toBe(false);
        vi.stubGlobal('navigator', { onLine: true });
        expect(isOnline()).toBe(true);
    });

    it('assumes it is online when the browser does not say', () => {
        vi.stubGlobal('navigator', {});
        expect(isOnline()).toBe(true);
    });
});

describe('openExternal', () => {
    it('gives the address to the replaceable opener', () => {
        const opener = vi.fn();
        setExternalOpener(opener);
        openExternal('https://github.com/a/b');
        expect(opener).toHaveBeenCalledWith('https://github.com/a/b');
    });

    it('opens a web page in a new tab without giving it access to the game', () => {
        const seen = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            seen.push({ href: this.href, target: this.target, rel: this.rel, attached: document.body.contains(this) });
        });
        openExternal('https://github.com/a/b');
        expect(seen).toEqual([
            { href: 'https://github.com/a/b', target: '_blank', rel: 'noopener noreferrer', attached: true },
        ]);
        expect(document.querySelector('a[href="https://github.com/a/b"]')).toBeNull();
    });

    it('opens an e-mail in the same window', () => {
        const seen = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            seen.push({ href: this.href, target: this.target });
        });
        openExternal('mailto:support@example.com');
        expect(seen).toEqual([{ href: 'mailto:support@example.com', target: '' }]);
    });
});
