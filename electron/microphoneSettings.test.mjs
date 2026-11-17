import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';

const { ensureMicrophoneAccess, SETTINGS_URLS } = createRequire(import.meta.url)('./microphoneSettings.cjs');

const run = (platform, status, asked = true) => {
    const openExternal = vi.fn();
    const systemPreferences = {
        getMediaAccessStatus: vi.fn(() => status),
        askForMediaAccess: vi.fn(async () => asked),
    };
    return ensureMicrophoneAccess({ platform, systemPreferences, openExternal }).then((result) => ({
        result,
        openExternal,
        systemPreferences,
    }));
};

describe('ensureMicrophoneAccess', () => {
    it('does nothing on Linux', async () => {
        const { result, openExternal, systemPreferences } = await run('linux', 'denied');
        expect(result).toBe('granted');
        expect(openExternal).not.toHaveBeenCalled();
        expect(systemPreferences.getMediaAccessStatus).not.toHaveBeenCalled();
    });

    it('lets Windows go when the microphone is allowed', async () => {
        const { result, openExternal } = await run('win32', 'granted');
        expect(result).toBe('granted');
        expect(openExternal).not.toHaveBeenCalled();
    });

    it('opens the Windows privacy page when the microphone is blocked', async () => {
        const { result, openExternal } = await run('win32', 'denied');
        expect(result).toBe('denied');
        expect(openExternal).toHaveBeenCalledWith(SETTINGS_URLS.win32);
    });

    it('opens the privacy page when the system restricts the microphone', async () => {
        const { openExternal } = await run('win32', 'restricted');
        expect(openExternal).toHaveBeenCalledWith(SETTINGS_URLS.win32);
    });

    it('does not open the page when Windows cannot tell', async () => {
        const { result, openExternal } = await run('win32', 'unknown');
        expect(result).toBe('granted');
        expect(openExternal).not.toHaveBeenCalled();
    });

    it('asks macOS and goes on when the player accepts', async () => {
        const { result, openExternal, systemPreferences } = await run('darwin', 'not-determined', true);
        expect(systemPreferences.askForMediaAccess).toHaveBeenCalledWith('microphone');
        expect(result).toBe('granted');
        expect(openExternal).not.toHaveBeenCalled();
    });

    it('opens the macOS privacy page when the player refuses', async () => {
        const { result, openExternal } = await run('darwin', 'not-determined', false);
        expect(result).toBe('denied');
        expect(openExternal).toHaveBeenCalledWith(SETTINGS_URLS.darwin);
    });

    it('opens the macOS privacy page when the microphone was refused before', async () => {
        const { openExternal, systemPreferences } = await run('darwin', 'denied');
        expect(systemPreferences.askForMediaAccess).not.toHaveBeenCalled();
        expect(openExternal).toHaveBeenCalledWith(SETTINGS_URLS.darwin);
    });
});
