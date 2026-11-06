#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

const MIN_NODE_MAJOR = 20;
const MIN_NPM_MAJOR = 10;

const major = (version) => Number.parseInt(String(version).replace(/^v/, ''), 10);

export function parseNpmVersion(userAgent) {
    const match = /^npm\/(\d+\.\d+\.\d+)/.exec(userAgent ?? '');
    return match?.[1];
}

export function diagnose({ nodeVersion, npmVersion, env }) {
    const problems = [];
    if (major(nodeVersion) < MIN_NODE_MAJOR) {
        problems.push({
            id: 'node-too-old',
            message: `Node ${nodeVersion} is too old (need >= ${MIN_NODE_MAJOR}).`,
            fix: 'Install Node 22 LTS (https://nodejs.org or `nvm install` in this folder).',
        });
    }
    if (npmVersion !== undefined && major(npmVersion) < MIN_NPM_MAJOR) {
        problems.push({
            id: 'npm-too-old',
            message:
                `npm ${npmVersion} cannot read the "npm:rolldown-vite" alias in package-lock.json; ` +
                '`npm ci` then fails with a misleading "no package-lock.json" error.',
            fix: 'Use the npm bundled with Node 22 (`nvm use`), or `npm install -g npm@10`.',
        });
    }
    if (env.ELECTRON_RUN_AS_NODE) {
        problems.push({
            id: 'electron-run-as-node',
            message:
                'ELECTRON_RUN_AS_NODE is set (VS Code terminals set it): a bare `electron .` ' +
                'would run as plain Node and crash on `app.whenReady`.',
            fix: 'Launch with `npm start` (it clears the variable), or `unset ELECTRON_RUN_AS_NODE`.',
        });
    }
    return problems;
}

function main() {
    const problems = diagnose({
        nodeVersion: process.version,
        npmVersion: parseNpmVersion(process.env.npm_config_user_agent),
        env: process.env,
    });
    if (problems.length === 0) {
        console.log('doctor: environment OK');
        return;
    }
    for (const p of problems) console.error(`doctor: ${p.message}\n  fix: ${p.fix}`);
    if (problems.some((p) => p.id !== 'electron-run-as-node')) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
