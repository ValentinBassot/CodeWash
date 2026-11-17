import { describe, expect, it, vi } from 'vitest';
import { launchNative, pickLauncher } from './run-electron-native.mjs';

const WSL_KERNEL = '6.6.114.1-microsoft-standard-WSL2';

describe('pickLauncher', () => {
    it('opens a native Windows window from WSL', () => {
        expect(pickLauncher({ platform: 'linux', env: {}, kernel: WSL_KERNEL })).toBe('windows');
        expect(pickLauncher({ platform: 'linux', env: { WSL_DISTRO_NAME: 'Ubuntu' }, kernel: '6.6.0' })).toBe(
            'windows',
        );
    });

    it.each([
        ['macOS', 'darwin', '23.4.0'],
        ['a plain Linux', 'linux', '6.8.0-generic'],
        ['Windows', 'win32', '10.0.22631'],
    ])('runs Electron where it is on %s', (_name, platform, kernel) => {
        expect(pickLauncher({ platform, env: {}, kernel })).toBe('local');
    });
});

describe('launchNative', () => {
    const launch = (platform, kernel) => {
        const runWindows = vi.fn();
        const runLocal = vi.fn();
        const launcher = launchNative({ platform, env: {}, kernel, runWindows, runLocal });
        return { launcher, runWindows, runLocal };
    };

    it('starts only the Windows launcher from WSL', () => {
        const { launcher, runWindows, runLocal } = launch('linux', WSL_KERNEL);
        expect(launcher).toBe('windows');
        expect(runWindows).toHaveBeenCalledTimes(1);
        expect(runLocal).not.toHaveBeenCalled();
    });

    it('starts only the local launcher on macOS and Linux', () => {
        const { launcher, runWindows, runLocal } = launch('darwin', '23.4.0');
        expect(launcher).toBe('local');
        expect(runLocal).toHaveBeenCalledTimes(1);
        expect(runWindows).not.toHaveBeenCalled();
    });
});
