#!/usr/bin/env node
import { release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isWsl, runWindows } from './run-electron-windows.mjs';
import { runLocal } from './run-electron.mjs';

export const pickLauncher = ({ platform, env, kernel }) =>
    platform === 'linux' && isWsl(env, kernel) ? 'windows' : 'local';

export const launchNative = ({ platform, env, kernel, runWindows: openWindows, runLocal: openLocal }) => {
    const launcher = pickLauncher({ platform, env, kernel });
    if (launcher === 'windows') openWindows();
    else openLocal();
    return launcher;
};

if (process.argv[1] === fileURLToPath(import.meta.url))
    launchNative({ platform: process.platform, env: process.env, kernel: release(), runWindows, runLocal });
