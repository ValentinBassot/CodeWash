import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetClock, setClock } from '../domain/clock';
import {
    CAPTURE_TIMEOUT_MS,
    MAX_IMAGE_BYTES,
    captureScreen,
    readImageFile,
    resetScreenshotProvider,
    setScreenshotProvider,
} from './screenshot';

beforeEach(() => {
    setClock(() => 1700000000000);
});

afterEach(() => {
    resetScreenshotProvider();
    resetClock();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const tracks = () => {
    const stop = vi.fn();
    return { stop, stream: { getTracks: () => [{ stop }, { stop }] } };
};

const named = (name) => Object.assign(new Error(name), { name });

describe('captureScreen with a replaceable provider', () => {
    it('is unsupported when the provider has nothing to capture with', async () => {
        setScreenshotProvider(() => null);
        expect(await captureScreen()).toEqual({ ok: false, reason: 'unsupported' });
    });

    it('returns the frame as a named PNG and lets go of the capture', async () => {
        const { stop, stream } = tracks();
        setScreenshotProvider(() => ({
            getStream: async () => stream,
            frameToDataUrl: async () => 'data:image/png;base64,AAAAAAAA',
        }));
        expect(await captureScreen()).toEqual({
            ok: true,
            screenshot: {
                name: 'screenshot-1700000000000.png',
                type: 'image/png',
                size: 6,
                dataUrl: 'data:image/png;base64,AAAAAAAA',
            },
        });
        expect(stop).toHaveBeenCalledTimes(2);
    });

    it('says denied when the player cancels the capture, failed for any other refusal', async () => {
        setScreenshotProvider(() => ({ getStream: async () => Promise.reject(named('NotAllowedError')) }));
        expect(await captureScreen()).toEqual({ ok: false, reason: 'denied' });
        setScreenshotProvider(() => ({ getStream: async () => Promise.reject(named('NotSupportedError')) }));
        expect(await captureScreen()).toEqual({ ok: false, reason: 'failed' });
        setScreenshotProvider(() => ({ getStream: async () => Promise.reject(undefined) }));
        expect(await captureScreen()).toEqual({ ok: false, reason: 'failed' });
    });

    it('stops after a time limit when the frame never comes, and lets go of the capture', async () => {
        vi.useFakeTimers();
        const { stop, stream } = tracks();
        setScreenshotProvider(() => ({
            getStream: async () => stream,
            frameToDataUrl: () => new Promise(() => {}),
        }));
        const result = captureScreen();
        await vi.advanceTimersByTimeAsync(CAPTURE_TIMEOUT_MS - 1);
        expect(stop).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(await result).toEqual({ ok: false, reason: 'timeout' });
        expect(stop).toHaveBeenCalledTimes(2);
        vi.useRealTimers();
    });

    it('does not wait for the time limit when the frame comes', async () => {
        vi.useFakeTimers();
        const { stream } = tracks();
        setScreenshotProvider(() => ({
            getStream: async () => stream,
            frameToDataUrl: async () => 'data:image/png;base64,AAAA',
        }));
        expect((await captureScreen()).ok).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
        vi.useRealTimers();
    });

    it('fails, and still lets go of the capture, when the frame cannot be read', async () => {
        const { stop, stream } = tracks();
        setScreenshotProvider(() => ({
            getStream: async () => stream,
            frameToDataUrl: async () => Promise.reject(new Error('no frame')),
        }));
        expect(await captureScreen()).toEqual({ ok: false, reason: 'failed' });
        expect(stop).toHaveBeenCalledTimes(2);
    });
});

describe('captureScreen with the browser', () => {
    it('is unsupported without getDisplayMedia', async () => {
        vi.stubGlobal('navigator', {});
        expect(await captureScreen()).toEqual({ ok: false, reason: 'unsupported' });
        vi.stubGlobal('navigator', { mediaDevices: {} });
        expect(await captureScreen()).toEqual({ ok: false, reason: 'unsupported' });
    });

    const stubFrame = (loadMetadata = true) => {
        const created = [];
        const real = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            const element = real(tag);
            created.push(element);
            if (tag === 'video') {
                Object.defineProperty(element, 'videoWidth', { value: 640 });
                Object.defineProperty(element, 'videoHeight', { value: 360 });
                element.play = vi.fn().mockResolvedValue();
                if (loadMetadata) queueMicrotask(() => element.dispatchEvent(new Event('loadedmetadata')));
            }
            return element;
        });
        const drawImage = vi.fn();
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage });
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,QUJD');
        return { created, drawImage };
    };

    it('asks for a display, draws one frame of the video on a canvas and stops the capture', async () => {
        const { stop, stream } = tracks();
        const getDisplayMedia = vi.fn().mockResolvedValue(stream);
        vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia } });
        const { created, drawImage } = stubFrame();
        const result = await captureScreen();
        expect(getDisplayMedia).toHaveBeenCalledWith({ video: true, audio: false });
        expect(result.screenshot.dataUrl).toBe('data:image/png;base64,QUJD');
        expect(result.screenshot.size).toBe(3);
        const canvas = created.find((element) => element.tagName === 'CANVAS');
        expect([canvas.width, canvas.height]).toEqual([640, 360]);
        expect(drawImage).toHaveBeenCalledWith(created[0], 0, 0);
        expect(created[0].srcObject).toBe(stream);
        expect(stop).toHaveBeenCalledTimes(2);
    });

    it('fails when the video cannot be played', async () => {
        const { stream } = tracks();
        vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: vi.fn().mockResolvedValue(stream) } });
        const { created } = stubFrame();
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
            throw new Error('tainted');
        });
        expect(await captureScreen()).toEqual({ ok: false, reason: 'failed' });
        expect(created.length).toBeGreaterThan(0);
    });

    it('fails when the video reports an error', async () => {
        const { stream } = tracks();
        vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: vi.fn().mockResolvedValue(stream) } });
        const real = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            const element = real(tag);
            if (tag === 'video') queueMicrotask(() => element.dispatchEvent(new Event('error')));
            return element;
        });
        expect(await captureScreen()).toEqual({ ok: false, reason: 'failed' });
    });
});

describe('readImageFile', () => {
    it('reads an image file as a data URL', async () => {
        const file = new File(['abc'], 'bug.png', { type: 'image/png' });
        const result = await readImageFile(file);
        expect(result).toEqual({
            ok: true,
            screenshot: { name: 'bug.png', type: 'image/png', size: 3, dataUrl: 'data:image/png;base64,YWJj' },
        });
    });

    it('refuses a file that is not an image', async () => {
        expect(await readImageFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toEqual({
            ok: false,
            reason: 'notImage',
        });
    });

    it('refuses an image that is too big', async () => {
        const big = new File(['x'], 'big.png', { type: 'image/png' });
        Object.defineProperty(big, 'size', { value: MAX_IMAGE_BYTES + 1 });
        expect(await readImageFile(big)).toEqual({ ok: false, reason: 'tooBig' });
    });

    it('says unreadable when the file cannot be read', async () => {
        vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () {
            queueMicrotask(() => this.onerror());
        });
        expect(await readImageFile(new File(['x'], 'bug.png', { type: 'image/png' }))).toEqual({
            ok: false,
            reason: 'unreadable',
        });
    });
});
