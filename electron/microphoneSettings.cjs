const SETTINGS_URLS = {
    win32: 'ms-settings:privacy-microphone',
    darwin: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
};

const BLOCKED = ['denied', 'restricted'];

async function ensureMicrophoneAccess({ platform, systemPreferences, openExternal }) {
    const url = SETTINGS_URLS[platform];
    if (!url) return 'granted';
    let status = systemPreferences.getMediaAccessStatus('microphone');
    if (status === 'not-determined' && platform === 'darwin') {
        status = (await systemPreferences.askForMediaAccess('microphone')) ? 'granted' : 'denied';
    }
    if (!BLOCKED.includes(status)) return 'granted';
    await openExternal(url);
    return 'denied';
}

module.exports = { ensureMicrophoneAccess, SETTINGS_URLS };
