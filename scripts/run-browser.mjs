#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFile } from 'node:fs';
import { homedir, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { isWsl } from './run-electron-windows.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PORT = 4173;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
};

const WINDOWS_BROWSERS = [
    ['Google', 'Chrome', 'Application', 'chrome.exe'],
    ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
];

const LINUX_BROWSERS = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];

export const browserCandidates = ({ platform, wsl, env }) => {
    if (wsl) {
        return ['Program Files', 'Program Files (x86)'].flatMap((dir) =>
            WINDOWS_BROWSERS.map((parts) => path.posix.join('/mnt/c', dir, ...parts)),
        );
    }
    if (platform === 'win32') {
        return [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA]
            .filter(Boolean)
            .flatMap((dir) => WINDOWS_BROWSERS.map((parts) => path.win32.join(dir, ...parts)));
    }
    if (platform === 'darwin') {
        return [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ];
    }
    return LINUX_BROWSERS.flatMap((name) =>
        (env.PATH || '')
            .split(path.delimiter)
            .filter(Boolean)
            .map((dir) => path.join(dir, name)),
    );
};

export const findBrowser = ({ platform, wsl, env, exists }) =>
    browserCandidates({ platform, wsl, env }).find((candidate) => exists(candidate)) ?? null;

export const browserArguments = ({ url, profileDir }) => [
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--app=${url}`,
];

export const staticHandler =
    (dir, read = readFile) =>
    (request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
        const file = path.join(dir, path.normalize(relative));
        if (!file.startsWith(dir + path.sep)) {
            response.writeHead(403).end();
            return;
        }
        read(file, (error, content) => {
            if (error) {
                response.writeHead(404).end();
                return;
            }
            response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] ?? 'application/octet-stream' });
            response.end(content);
        });
    };

export const profileDirectory = ({ wsl, platform, env, home, windowsLocalAppData }) => {
    if (wsl || platform === 'win32') {
        const base = wsl ? windowsLocalAppData() : env.LOCALAPPDATA;
        return path.win32.join(base, 'CodeWash', 'browser');
    }
    return path.join(home, '.codewash', 'browser');
};

export const runBrowser = ({
    platform,
    env,
    kernel,
    home,
    dist,
    exists,
    windowsLocalAppData,
    startServer,
    launch,
    log,
}) => {
    const wsl = platform === 'linux' && isWsl(env, kernel);
    const browser = findBrowser({ platform, wsl, env, exists });
    if (!browser) {
        log('No Chrome or Edge found. Install one of them, or use "npm start" (voice recognition needs a browser).');
        return Promise.resolve(1);
    }
    const profileDir = profileDirectory({ wsl, platform, env, home, windowsLocalAppData });
    return startServer(dist, PORT).then(
        (server) =>
            new Promise((resolve) => {
                const child = launch(browser, browserArguments({ url: `http://localhost:${PORT}/`, profileDir }));
                child.on('exit', (code) => {
                    server.close();
                    resolve(code ?? 0);
                });
            }),
        (error) => {
            log(`Cannot serve the game on port ${PORT}: ${error.message}`);
            return 1;
        },
    );
};

const listen = (dir, port) =>
    new Promise((resolve, reject) => {
        const server = createServer(staticHandler(dir));
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });

const systemContext = () => ({
    platform: process.platform,
    env: process.env,
    kernel: release(),
    home: homedir(),
    exists: existsSync,
});

export const canOpenInBrowser = (context = systemContext()) =>
    findBrowser({
        platform: context.platform,
        wsl: context.platform === 'linux' && isWsl(context.env, context.kernel),
        env: context.env,
        exists: context.exists,
    }) !== null;

export const openInBrowser = () =>
    runBrowser({
        ...systemContext(),
        dist: path.join(root, 'dist'),
        windowsLocalAppData: () =>
            execFileSync('cmd.exe', ['/c', 'echo %LOCALAPPDATA%'], { encoding: 'utf8', cwd: '/mnt/c' }).trim(),
        startServer: listen,
        launch: (command, args) => spawn(command, args, { stdio: 'inherit' }),
        log: console.error,
    }).then((code) => {
        process.exitCode = code;
    });

if (process.argv[1] === fileURLToPath(import.meta.url)) openInBrowser();
