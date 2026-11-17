import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isWsl, appManifest, ELECTRON_FILES } from './run-electron-windows.mjs';

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
