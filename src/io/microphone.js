const browserProvider = () => {
    const devices = navigator.mediaDevices;
    return devices?.getUserMedia ? devices.getUserMedia.bind(devices) : null;
};

let provider = browserProvider;

export const setMicrophoneProvider = (next) => {
    provider = next;
};

export const resetMicrophoneProvider = () => {
    provider = browserProvider;
};

const MISSING_DEVICE_ERRORS = ['NotFoundError', 'OverconstrainedError'];

export const requestMicrophoneAccess = async () => {
    const getUserMedia = provider();
    if (!getUserMedia) return 'unavailable';
    try {
        const stream = await getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return 'granted';
    } catch (error) {
        return MISSING_DEVICE_ERRORS.includes(error?.name) ? 'unavailable' : 'denied';
    }
};
