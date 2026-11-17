#!/usr/bin/env node
import { release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { canOpenInBrowser, openInBrowser } from './run-browser.mjs';
import { isWsl, runWindows } from './run-electron-windows.mjs';
import { runLocal } from './run-electron.mjs';

export const pickLauncher = ({ platform, env, kernel, browser }) => {
    if (browser) return 'browser';
    return platform === 'linux' && isWsl(env, kernel) ? 'windows' : 'local';
};

export const launchNative = ({
    platform,
    env,
    kernel,
    browser,
    openInBrowser: openBrowser,
    runWindows: openWindows,
    runLocal: openLocal,
}) => {
    const launcher = pickLauncher({ platform, env, kernel, browser });
    if (launcher === 'browser') openBrowser();
    else if (launcher === 'windows') openWindows();
    else openLocal();
    return launcher;
};

if (process.argv[1] === fileURLToPath(import.meta.url))
    launchNative({
        platform: process.platform,
        env: process.env,
        kernel: release(),
        browser: canOpenInBrowser(),
        openInBrowser,
        runWindows,
        runLocal,
    });
