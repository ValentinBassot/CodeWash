#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export function electronEnv(env) {
    const clean = { ...env };
    delete clean.ELECTRON_RUN_AS_NODE;
    return clean;
}

export function runLocal() {
    const electronBinary = createRequire(import.meta.url)('electron');
    const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: electronEnv(process.env),
    });
    child.on('exit', (code, signal) => {
        process.exitCode = code ?? (signal ? 1 : 0);
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runLocal();
