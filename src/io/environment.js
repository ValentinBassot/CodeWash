import { version } from '../../package.json';

export const APP_VERSION = version;

export const readEnvironment = () => ({
    runtime: navigator.userAgent.includes('Electron/') ? 'Electron' : 'Browser',
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
});

export const isOnline = () => navigator.onLine !== false;

const browserOpener = (url) => {
    const link = document.createElement('a');
    link.href = url;
    if (url.startsWith('https:')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
};

let opener = browserOpener;

export const setExternalOpener = (next) => {
    opener = next;
};

export const resetExternalOpener = () => {
    opener = browserOpener;
};

export const openExternal = (url) => {
    opener(url);
};
