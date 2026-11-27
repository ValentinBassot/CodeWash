import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
    isWsl,
    appManifest,
    ELECTRON_FILES,
    ensureWindowsElectron,
    localAppData,
    nodeSystem,
    runWindows,
} from './run-electron-windows.mjs';

const WSL_KERNEL = '6.6.114.1-microsoft-standard-WSL2';
const LOCAL_APP_DATA = '/mnt/c/Users/a/AppData/Local';
const BASE = path.join(LOCAL_APP_DATA, 'CodeWash');
const APP_DIR = path.join(BASE, 'app');
const CACHE_DIR = path.join(BASE, 'electron');

const wslPath = vi.fn((command, args) => {
    if (command === 'cmd.exe') return 'C:\\Users\\a\\AppData\\Local\r\n';
    return args[0] === '-u' ? `${LOCAL_APP_DATA}\n` : `W:${args[1]}\n`;
});

const setup = (overrides = {}) => {
    const child = new EventEmitter();
    const system = {
        env: { WSL_DISTRO_NAME: 'Ubuntu', ELECTRON_RUN_AS_NODE: '1' },
        kernel: WSL_KERNEL,
        argv: ['--flag'],
        root: '/project',
        execFile: vi.fn(wslPath),
        spawnProcess: vi.fn(() => child),
        fs: {
            exists: vi.fn(() => true),
            rmSync: vi.fn(),
            mkdirSync: vi.fn(),
            cpSync: vi.fn(),
            writeFileSync: vi.fn(),
        },
        electronVersion: '39.8.5',
        download: vi.fn(() => Promise.resolve('/tmp/electron.zip')),
        log: vi.fn(),
        error: vi.fn(),
        exit: vi.fn(),
        setExitCode: vi.fn(),
        ...overrides,
    };
    return { system, child };
};

describe('isWsl', () => {
    it('detects WSL from the distro variable', () => {
        expect(isWsl({ WSL_DISTRO_NAME: 'Ubuntu' }, '6.6.0')).toBe(true);
    });

    it('detects WSL from the kernel release', () => {
        expect(isWsl({}, '6.6.114.1-microsoft-standard-WSL2')).toBe(true);
    });

    it('is false on a plain Linux', () => {
        expect(isWsl({}, '6.8.0-generic')).toBe(false);
    });
});

describe('appManifest', () => {
    it('points Electron at the main process file', () => {
        expect(appManifest().main).toBe('electron/main.cjs');
    });
});

describe('ELECTRON_FILES', () => {
    it('lists the main process file and every local file it requires', () => {
        const main = readFileSync(path.join(process.cwd(), 'electron', 'main.cjs'), 'utf8');
        const required = [...main.matchAll(/require\('\.\/([^']+)'\)/g)].map((match) => match[1]);
        expect(ELECTRON_FILES).toEqual(expect.arrayContaining(['main.cjs', ...required]));
    });
});

describe('localAppData', () => {
    it('asks Windows for the folder and converts it to a WSL path', () => {
        const { system } = setup();
        expect(localAppData(system.execFile)).toBe(LOCAL_APP_DATA);
        expect(system.execFile).toHaveBeenNthCalledWith(1, 'cmd.exe', ['/c', 'echo %LOCALAPPDATA%'], {
            encoding: 'utf8',
            cwd: '/mnt/c',
        });
        expect(system.execFile).toHaveBeenNthCalledWith(2, 'wslpath', ['-u', 'C:\\Users\\a\\AppData\\Local'], {
            encoding: 'utf8',
        });
    });
});

describe('ensureWindowsElectron', () => {
    it('reuses the Electron already downloaded', async () => {
        const { system } = setup();
        expect(await ensureWindowsElectron(CACHE_DIR, system)).toBe(path.join(CACHE_DIR, 'electron.exe'));
        expect(system.download).not.toHaveBeenCalled();
    });

    it('downloads and unzips the Windows Electron when it is missing', async () => {
        const { system } = setup();
        system.fs.exists.mockReturnValue(false);
        expect(await ensureWindowsElectron(CACHE_DIR, system)).toBe(path.join(CACHE_DIR, 'electron.exe'));
        expect(system.log).toHaveBeenCalledWith('Downloading Electron 39.8.5 for Windows...');
        expect(system.download).toHaveBeenCalledWith({
            version: '39.8.5',
            platform: 'win32',
            arch: 'x64',
            artifactName: 'electron',
        });
        expect(system.fs.mkdirSync).toHaveBeenCalledWith(CACHE_DIR, { recursive: true });
        expect(system.execFile).toHaveBeenCalledWith('unzip', ['-q', '-o', '/tmp/electron.zip', '-d', CACHE_DIR], {
            stdio: 'inherit',
        });
    });
});

describe('runWindows', () => {
    it('refuses to run outside WSL', async () => {
        const { system } = setup({ env: {}, kernel: '6.8.0-generic' });
        await runWindows(system);
        expect(system.error).toHaveBeenCalledWith('This command is for WSL. Use "npm start" elsewhere.');
        expect(system.exit).toHaveBeenCalledWith(1);
        expect(system.spawnProcess).not.toHaveBeenCalled();
        expect(system.fs.rmSync).not.toHaveBeenCalled();
    });

    it('copies the build and the Electron files, then starts the Windows Electron', async () => {
        const { system } = setup();
        await runWindows(system);
        expect(system.fs.rmSync).toHaveBeenCalledWith(APP_DIR, { recursive: true, force: true });
        expect(system.fs.mkdirSync).toHaveBeenCalledWith(path.join(APP_DIR, 'electron'), { recursive: true });
        expect(system.fs.cpSync).toHaveBeenCalledWith(path.join('/project', 'dist'), path.join(APP_DIR, 'dist'), {
            recursive: true,
        });
        for (const file of ELECTRON_FILES) {
            expect(system.fs.cpSync).toHaveBeenCalledWith(
                path.join('/project', 'electron', file),
                path.join(APP_DIR, 'electron', file),
            );
        }
        expect(system.fs.writeFileSync).toHaveBeenCalledWith(
            path.join(APP_DIR, 'package.json'),
            JSON.stringify(appManifest(), null, 2),
        );
        const [exe, args, options] = system.spawnProcess.mock.calls[0];
        expect(exe).toBe(path.join(CACHE_DIR, 'electron.exe'));
        expect(args).toEqual([`W:${APP_DIR}`, '--flag']);
        expect(options.stdio).toBe('inherit');
        expect(options.env.ELECTRON_RUN_AS_NODE).toBeUndefined();
        expect(options.env.WSL_DISTRO_NAME).toBe('Ubuntu');
    });

    it.each([
        ['the exit code of Electron', [4, null], 4],
        ['1 when Electron is killed by a signal', [null, 'SIGTERM'], 1],
        ['0 when Electron ends without a code', [null, null], 0],
    ])('sets %s', async (_name, [code, signal], expected) => {
        const { system, child } = setup();
        await runWindows(system);
        child.emit('exit', code, signal);
        expect(system.setExitCode).toHaveBeenCalledWith(expected);
    });
});

describe('nodeSystem', () => {
    it('plugs the real Node functions and the installed Electron', () => {
        const system = nodeSystem();
        expect(system.execFile).toBe(execFileSync);
        expect(system.fs.exists).toBe(existsSync);
        expect(system.electronVersion).toBe(createRequire(import.meta.url)('electron/package.json').version);
        expect(system.download).toBeTypeOf('function');
        expect(system.root).toBe(process.cwd());
        expect(system.log).toBe(console.log);
        expect(system.error).toBe(console.error);
    });

    it('sets the exit code of the process', () => {
        const before = process.exitCode;
        try {
            nodeSystem().setExitCode(0);
            expect(process.exitCode).toBe(0);
        } finally {
            process.exitCode = before;
        }
    });
});
