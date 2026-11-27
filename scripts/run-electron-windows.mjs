#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { release } from 'node:os';
import path from 'node:path';
import { electronEnv } from './run-electron.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const ELECTRON_FILES = ['main.cjs', 'microphoneSettings.cjs'];

export function isWsl(env, kernel) {
    return Boolean(env.WSL_DISTRO_NAME) || /microsoft/i.test(kernel);
}

export function appManifest() {
    return { name: 'codewash', version: '0.0.0', main: 'electron/main.cjs' };
}

export const toLinuxPath = (execFile, windowsPath) =>
    execFile('wslpath', ['-u', windowsPath], { encoding: 'utf8' }).trim();

export const toWindowsPath = (execFile, linuxPath) =>
    execFile('wslpath', ['-w', linuxPath], { encoding: 'utf8' }).trim();

export const localAppData = (execFile) =>
    toLinuxPath(
        execFile,
        execFile('cmd.exe', ['/c', 'echo %LOCALAPPDATA%'], { encoding: 'utf8', cwd: '/mnt/c' }).trim(),
    );

export const ensureWindowsElectron = async (cacheDir, { fs, electronVersion, download, execFile, log }) => {
    const exe = path.join(cacheDir, 'electron.exe');
    if (fs.exists(exe)) return exe;
    log(`Downloading Electron ${electronVersion} for Windows...`);
    const zip = await download({
        version: electronVersion,
        platform: 'win32',
        arch: 'x64',
        artifactName: 'electron',
    });
    fs.mkdirSync(cacheDir, { recursive: true });
    execFile('unzip', ['-q', '-o', zip, '-d', cacheDir], { stdio: 'inherit' });
    return exe;
};

export const nodeSystem = () => {
    const require = createRequire(import.meta.url);
    return {
        env: process.env,
        kernel: release(),
        argv: process.argv.slice(2),
        root,
        execFile: execFileSync,
        spawnProcess: spawn,
        fs: { exists: existsSync, rmSync, mkdirSync, cpSync, writeFileSync },
        electronVersion: require('electron/package.json').version,
        download: require('@electron/get').downloadArtifact,
        log: console.log,
        error: console.error,
        exit: process.exit,
        setExitCode: (code) => {
            process.exitCode = code;
        },
    };
};

export async function runWindows(system = nodeSystem()) {
    const { env, kernel, argv, execFile, spawnProcess, fs, error, exit, setExitCode } = system;
    if (!isWsl(env, kernel)) {
        error('This command is for WSL. Use "npm start" elsewhere.');
        return exit(1);
    }
    const base = path.join(localAppData(execFile), 'CodeWash');
    const exe = await ensureWindowsElectron(path.join(base, 'electron'), system);
    const appDir = path.join(base, 'app');
    fs.rmSync(appDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(appDir, 'electron'), { recursive: true });
    fs.cpSync(path.join(system.root, 'dist'), path.join(appDir, 'dist'), { recursive: true });
    for (const file of ELECTRON_FILES) {
        fs.cpSync(path.join(system.root, 'electron', file), path.join(appDir, 'electron', file));
    }
    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appManifest(), null, 2));
    const child = spawnProcess(exe, [toWindowsPath(execFile, appDir), ...argv], {
        stdio: 'inherit',
        env: electronEnv(env),
    });
    child.on('exit', (code, signal) => setExitCode(code ?? (signal ? 1 : 0)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runWindows();
