#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { electronEnv } from './run-electron.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const ELECTRON_FILES = ['main.cjs', 'microphoneSettings.cjs'];

export function isWsl(env, release) {
    return Boolean(env.WSL_DISTRO_NAME) || /microsoft/i.test(release);
}

export function appManifest() {
    return { name: 'codewash', version: '0.0.0', main: 'electron/main.cjs' };
}

function windowsPath(linuxPath) {
    return execFileSync('wslpath', ['-u', linuxPath], { encoding: 'utf8' }).trim();
}

function toWindows(linuxPath) {
    return execFileSync('wslpath', ['-w', linuxPath], { encoding: 'utf8' }).trim();
}

function localAppData() {
    const raw = execFileSync('cmd.exe', ['/c', 'echo %LOCALAPPDATA%'], {
        encoding: 'utf8',
        cwd: '/mnt/c',
    }).trim();
    return windowsPath(raw);
}

async function ensureWindowsElectron(cacheDir) {
    const exe = path.join(cacheDir, 'electron.exe');
    if (existsSync(exe)) return exe;
    const require = createRequire(import.meta.url);
    const { version } = require('electron/package.json');
    const { downloadArtifact } = require('@electron/get');
    console.log(`Downloading Electron ${version} for Windows...`);
    const zip = await downloadArtifact({
        version,
        platform: 'win32',
        arch: 'x64',
        artifactName: 'electron',
    });
    mkdirSync(cacheDir, { recursive: true });
    execFileSync('unzip', ['-q', '-o', zip, '-d', cacheDir], { stdio: 'inherit' });
    return exe;
}

export async function runWindows() {
    if (!isWsl(process.env, (await import('node:os')).release())) {
        console.error('This command is for WSL. Use "npm start" elsewhere.');
        process.exit(1);
    }
    const base = path.join(localAppData(), 'CodeWash');
    const exe = await ensureWindowsElectron(path.join(base, 'electron'));
    const appDir = path.join(base, 'app');
    rmSync(appDir, { recursive: true, force: true });
    mkdirSync(path.join(appDir, 'electron'), { recursive: true });
    cpSync(path.join(root, 'dist'), path.join(appDir, 'dist'), { recursive: true });
    for (const file of ELECTRON_FILES) {
        cpSync(path.join(root, 'electron', file), path.join(appDir, 'electron', file));
    }
    writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appManifest(), null, 2));
    const child = spawn(exe, [toWindows(appDir), ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: electronEnv(process.env),
    });
    child.on('exit', (code, signal) => {
        process.exitCode = code ?? (signal ? 1 : 0);
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runWindows();
