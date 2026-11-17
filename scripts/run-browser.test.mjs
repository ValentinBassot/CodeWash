import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
    PORT,
    browserArguments,
    browserCandidates,
    canOpenInBrowser,
    findBrowser,
    profileDirectory,
    runBrowser,
    staticHandler,
} from './run-browser.mjs';

const WSL_KERNEL = '6.6.114.1-microsoft-standard-WSL2';

describe('browserCandidates', () => {
    it('looks for the Windows browsers through /mnt/c from WSL', () => {
        const list = browserCandidates({ platform: 'linux', wsl: true, env: {} });
        expect(list[0]).toBe('/mnt/c/Program Files/Google/Chrome/Application/chrome.exe');
        expect(list).toContain('/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
    });

    it('uses the program folders of Windows', () => {
        const env = { ProgramFiles: 'C:\\Program Files', LOCALAPPDATA: 'C:\\Users\\a\\AppData\\Local' };
        const list = browserCandidates({ platform: 'win32', wsl: false, env });
        expect(list[0]).toBe('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
        expect(list).toContain('C:\\Users\\a\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe');
        expect(list.some((entry) => entry.includes('undefined'))).toBe(false);
    });

    it('looks in the Applications folder on macOS', () => {
        const list = browserCandidates({ platform: 'darwin', wsl: false, env: {} });
        expect(list[0]).toBe('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    });

    it('looks in the PATH on Linux', () => {
        const list = browserCandidates({ platform: 'linux', wsl: false, env: { PATH: '/usr/bin:/opt/bin' } });
        expect(list).toContain('/usr/bin/google-chrome');
        expect(list).toContain('/opt/bin/chromium');
    });

    it('finds nothing on Linux without a PATH', () => {
        expect(browserCandidates({ platform: 'linux', wsl: false, env: {} })).toEqual([]);
    });
});

describe('findBrowser', () => {
    it('returns the first browser that exists', () => {
        const wanted = '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
        const found = findBrowser({ platform: 'linux', wsl: true, env: {}, exists: (file) => file === wanted });
        expect(found).toBe(wanted);
    });

    it('returns null when none exists', () => {
        expect(findBrowser({ platform: 'darwin', wsl: false, env: {}, exists: () => false })).toBeNull();
    });
});

describe('browserArguments', () => {
    it('opens the game as an application window with its own profile', () => {
        expect(browserArguments({ url: 'http://localhost:4173/', profileDir: '/p' })).toEqual([
            '--user-data-dir=/p',
            '--no-first-run',
            '--no-default-browser-check',
            '--app=http://localhost:4173/',
        ]);
    });
});

describe('profileDirectory', () => {
    it('lives in the Windows local data from WSL', () => {
        const dir = profileDirectory({
            wsl: true,
            platform: 'linux',
            env: {},
            home: '/home/a',
            windowsLocalAppData: () => 'C:\\Users\\a\\AppData\\Local',
        });
        expect(dir).toBe('C:\\Users\\a\\AppData\\Local\\CodeWash\\browser');
    });

    it('lives in the local data on Windows', () => {
        const dir = profileDirectory({
            wsl: false,
            platform: 'win32',
            env: { LOCALAPPDATA: 'C:\\Users\\b\\AppData\\Local' },
            home: 'C:\\Users\\b',
        });
        expect(dir).toBe('C:\\Users\\b\\AppData\\Local\\CodeWash\\browser');
    });

    it('lives in the home folder elsewhere', () => {
        const dir = profileDirectory({ wsl: false, platform: 'darwin', env: {}, home: '/Users/c' });
        expect(dir).toBe(path.join('/Users/c', '.codewash', 'browser'));
    });
});

describe('staticHandler', () => {
    const respond = (url, read) => {
        const response = { writeHead: vi.fn(() => response), end: vi.fn() };
        staticHandler(path.resolve('/site'), read)({ url }, response);
        return response;
    };

    it('serves index.html at the root', () => {
        const read = vi.fn((file, done) => done(null, 'page'));
        const response = respond('/', read);
        expect(read.mock.calls[0][0]).toBe(path.resolve('/site', 'index.html'));
        expect(response.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
        expect(response.end).toHaveBeenCalledWith('page');
    });

    it('serves a file with its type', () => {
        const response = respond('/assets/a.js', (file, done) => done(null, 'code'));
        expect(response.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    });

    it('serves an unknown extension as bytes', () => {
        const response = respond('/a.bin', (file, done) => done(null, 'x'));
        expect(response.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
    });

    it('answers 404 when the file is missing', () => {
        const response = respond('/nope.js', (file, done) => done(new Error('missing')));
        expect(response.writeHead).toHaveBeenCalledWith(404);
    });

    it('refuses to leave the folder', () => {
        const read = vi.fn();
        const response = respond('/..%2Fsecret.txt', read);
        expect(response.writeHead).toHaveBeenCalledWith(403);
        expect(read).not.toHaveBeenCalled();
    });
});

describe('runBrowser', () => {
    const setup = (overrides = {}) => {
        const child = new EventEmitter();
        const server = { close: vi.fn() };
        const deps = {
            platform: 'linux',
            env: { WSL_DISTRO_NAME: 'Ubuntu' },
            kernel: WSL_KERNEL,
            home: '/home/a',
            dist: '/site',
            exists: () => true,
            windowsLocalAppData: () => 'C:\\Users\\a\\AppData\\Local',
            startServer: vi.fn(() => Promise.resolve(server)),
            launch: vi.fn(() => child),
            log: vi.fn(),
            ...overrides,
        };
        return { deps, child, server };
    };

    it('serves the build, opens the browser and stops the server when it closes', async () => {
        const { deps, child, server } = setup();
        const done = runBrowser(deps);
        await vi.waitFor(() => expect(deps.launch).toHaveBeenCalled());
        expect(deps.startServer).toHaveBeenCalledWith('/site', PORT);
        const [command, args] = deps.launch.mock.calls[0];
        expect(command).toBe('/mnt/c/Program Files/Google/Chrome/Application/chrome.exe');
        expect(args).toContain(`--app=http://localhost:${PORT}/`);
        expect(args).toContain('--user-data-dir=C:\\Users\\a\\AppData\\Local\\CodeWash\\browser');
        child.emit('exit', 0);
        expect(await done).toBe(0);
        expect(server.close).toHaveBeenCalled();
    });

    it('passes the exit code of the browser', async () => {
        const { deps, child } = setup({ platform: 'darwin', env: {}, kernel: '23.4.0' });
        const done = runBrowser(deps);
        await vi.waitFor(() => expect(deps.launch).toHaveBeenCalled());
        child.emit('exit', null);
        expect(await done).toBe(0);
    });

    it('explains when no browser is installed', async () => {
        const { deps } = setup({ exists: () => false });
        expect(await runBrowser(deps)).toBe(1);
        expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('No Chrome or Edge found'));
        expect(deps.startServer).not.toHaveBeenCalled();
    });

    it('explains when the port is taken', async () => {
        const { deps } = setup({ startServer: vi.fn(() => Promise.reject(new Error('EADDRINUSE'))) });
        expect(await runBrowser(deps)).toBe(1);
        expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('EADDRINUSE'));
        expect(deps.launch).not.toHaveBeenCalled();
    });
});

describe('canOpenInBrowser', () => {
    const context = (exists) => ({ platform: 'darwin', env: {}, kernel: '23.4.0', exists });

    it('is true when a browser exists', () => {
        expect(canOpenInBrowser(context(() => true))).toBe(true);
    });

    it('is false when none exists', () => {
        expect(canOpenInBrowser(context(() => false))).toBe(false);
    });

    it('looks through /mnt/c from WSL', () => {
        const seen = [];
        canOpenInBrowser({
            platform: 'linux',
            env: {},
            kernel: WSL_KERNEL,
            exists: (file) => {
                seen.push(file);
                return false;
            },
        });
        expect(seen[0]).toMatch(/^\/mnt\/c\//);
    });
});
