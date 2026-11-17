import { describe, expect, it, vi } from 'vitest';
import { launchNative, pickLauncher } from './run-electron-native.mjs';

const WSL_KERNEL = '6.6.114.1-microsoft-standard-WSL2';

describe('pickLauncher', () => {
    it('opens a native Windows window from WSL', () => {
        expect(pickLauncher({ platform: 'linux', env: {}, kernel: WSL_KERNEL, browser: false })).toBe('windows');
        expect(
            pickLauncher({ platform: 'linux', env: { WSL_DISTRO_NAME: 'Ubuntu' }, kernel: '6.6.0', browser: false }),
        ).toBe('windows');
    });

    it.each([
        ['macOS', 'darwin', '23.4.0'],
        ['a plain Linux', 'linux', '6.8.0-generic'],
        ['Windows', 'win32', '10.0.22631'],
    ])('runs Electron where it is on %s', (_name, platform, kernel) => {
        expect(pickLauncher({ platform, env: {}, kernel, browser: false })).toBe('local');
    });
});

describe('pickLauncher with a browser', () => {
    it.each([
        ['WSL', 'linux', WSL_KERNEL],
        ['macOS', 'darwin', '23.4.0'],
        ['Windows', 'win32', '10.0.22631'],
    ])('opens the browser window on %s because voice recognition works there', (_name, platform, kernel) => {
        expect(pickLauncher({ platform, env: {}, kernel, browser: true })).toBe('browser');
    });
});

describe('launchNative', () => {
    const launch = (platform, kernel, browser = false) => {
        const openInBrowser = vi.fn();
        const runWindows = vi.fn();
        const runLocal = vi.fn();
        const launcher = launchNative({
            platform,
            env: {},
            kernel,
            browser,
            openInBrowser,
            runWindows,
            runLocal,
        });
        return { launcher, openInBrowser, runWindows, runLocal };
    };

    it('starts only the browser window when a browser is installed', () => {
        const { launcher, openInBrowser, runWindows, runLocal } = launch('linux', WSL_KERNEL, true);
        expect(launcher).toBe('browser');
        expect(openInBrowser).toHaveBeenCalledTimes(1);
        expect(runWindows).not.toHaveBeenCalled();
        expect(runLocal).not.toHaveBeenCalled();
    });

    it('starts only the Windows launcher from WSL without a browser', () => {
        const { launcher, openInBrowser, runWindows, runLocal } = launch('linux', WSL_KERNEL);
        expect(launcher).toBe('windows');
        expect(runWindows).toHaveBeenCalledTimes(1);
        expect(runLocal).not.toHaveBeenCalled();
        expect(openInBrowser).not.toHaveBeenCalled();
    });

    it('starts only the local launcher on macOS and Linux without a browser', () => {
        const { launcher, openInBrowser, runWindows, runLocal } = launch('darwin', '23.4.0');
        expect(launcher).toBe('local');
        expect(runLocal).toHaveBeenCalledTimes(1);
        expect(runWindows).not.toHaveBeenCalled();
        expect(openInBrowser).not.toHaveBeenCalled();
    });
});
