import { now } from '../domain/clock';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const CAPTURE_TIMEOUT_MS = 10000;

const frameToDataUrl = (stream) =>
    new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.srcObject = stream;
        video.onerror = () => reject(new Error('video error'));
        video.onloadedmetadata = async () => {
            try {
                await video.play();
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        };
    });

const browserSource = () => {
    const devices = navigator.mediaDevices;
    if (!devices?.getDisplayMedia) return null;
    return { getStream: () => devices.getDisplayMedia({ video: true, audio: false }), frameToDataUrl };
};

let provider = browserSource;

export const setScreenshotProvider = (next) => {
    provider = next;
};

export const resetScreenshotProvider = () => {
    provider = browserSource;
};

const withTimeout = (promise, ms) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(Object.assign(new Error('capture timeout'), { name: 'TimeoutError' })),
            ms,
        );
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });

const approximateBytes = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

export const captureScreen = async () => {
    const source = provider();
    if (!source) return { ok: false, reason: 'unsupported' };
    let stream;
    try {
        stream = await source.getStream();
    } catch (error) {
        return { ok: false, reason: error?.name === 'NotAllowedError' ? 'denied' : 'failed' };
    }
    try {
        const dataUrl = await withTimeout(source.frameToDataUrl(stream), CAPTURE_TIMEOUT_MS);
        return {
            ok: true,
            screenshot: {
                name: `screenshot-${now()}.png`,
                type: 'image/png',
                size: approximateBytes(dataUrl),
                dataUrl,
            },
        };
    } catch (error) {
        return { ok: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'failed' };
    } finally {
        stream.getTracks().forEach((track) => track.stop());
    }
};

export const readImageFile = (file) =>
    new Promise((resolve) => {
        if (!file.type.startsWith('image/')) return resolve({ ok: false, reason: 'notImage' });
        if (file.size > MAX_IMAGE_BYTES) return resolve({ ok: false, reason: 'tooBig' });
        const reader = new FileReader();
        reader.onerror = () => resolve({ ok: false, reason: 'unreadable' });
        reader.onload = () =>
            resolve({
                ok: true,
                screenshot: { name: file.name, type: file.type, size: file.size, dataUrl: reader.result },
            });
        reader.readAsDataURL(file);
    });
