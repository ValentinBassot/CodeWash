#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const parseLcov = (text) => {
    const files = new Map();
    let current = null;
    for (const line of text.split('\n')) {
        if (line.startsWith('SF:')) {
            current = new Map();
            files.set(line.slice(3).trim(), current);
        } else if (line.startsWith('DA:') && current) {
            const [lineNumber, hits] = line.slice(3).split(',').map(Number);
            current.set(lineNumber, hits);
        } else if (line.startsWith('end_of_record')) {
            current = null;
        }
    }
    return files;
};

export const parseDiff = (text) => {
    const files = new Map();
    let file = null;
    let removed = 0;
    let nextLine = 0;
    for (const line of text.split('\n')) {
        if (line.startsWith('+++ ')) {
            const path = line.slice(4).trim();
            file = path === '/dev/null' ? null : path.replace(/^b\//, '');
        } else if (line.startsWith('@@')) {
            const match = /\+(\d+)/.exec(line);
            nextLine = Number(match[1]);
            removed = 0;
        } else if (file && line.startsWith('-') && !line.startsWith('---')) {
            removed += 1;
        } else if (file && line.startsWith('+')) {
            if (!files.has(file)) files.set(file, { modified: [], added: [] });
            const entry = files.get(file);
            if (removed > 0) {
                entry.modified.push(nextLine);
                removed -= 1;
            } else {
                entry.added.push(nextLine);
            }
            nextLine += 1;
        }
    }
    return files;
};

const ratio = (total, covered) => ({ total, covered, pct: total === 0 ? 100 : Math.floor((covered / total) * 100) });

export const evaluate = (diff, lcov, thresholds) => {
    const counts = { added: [0, 0], modified: [0, 0] };
    const uncovered = [];
    for (const [file, changes] of diff) {
        const hits = lcov.get(file);
        if (!hits) continue;
        for (const kind of ['modified', 'added']) {
            for (const line of changes[kind]) {
                if (!hits.has(line)) continue;
                counts[kind][0] += 1;
                if (hits.get(line) > 0) counts[kind][1] += 1;
                else uncovered.push(`${file}:${line} (${kind})`);
            }
        }
    }
    const added = ratio(...counts.added);
    const modified = ratio(...counts.modified);
    uncovered.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    return {
        added,
        modified,
        uncovered,
        ok: added.pct >= thresholds.added && modified.pct >= thresholds.modified,
    };
};

const THRESHOLDS = { added: 100, modified: 80 };

export const report = (result, base, log) => {
    log(`diff-coverage against ${base}`);
    log(`  added lines:    ${result.added.covered}/${result.added.total} covered (${result.added.pct} %, need 100 %)`);
    log(
        `  modified lines: ${result.modified.covered}/${result.modified.total} covered (${result.modified.pct} %, need 80 %)`,
    );
    for (const line of result.uncovered) log(`  not covered: ${line}`);
    return result.ok ? 0 : 1;
};

export const main = ({
    argv = process.argv,
    env = process.env,
    lcovPath = 'coverage/lcov.info',
    log = console.log,
} = {}) => {
    const base = argv[2] || env.DIFF_BASE || 'origin/develop';
    if (!existsSync(lcovPath)) {
        log(`diff-coverage: ${lcovPath} not found, run "npm run test:coverage" first`);
        return 1;
    }
    const diffText = execFileSync('git', ['diff', '--unified=0', `${base}...HEAD`, '--', 'src', 'scripts'], {
        encoding: 'utf8',
    });
    const result = evaluate(parseDiff(diffText), parseLcov(readFileSync(lcovPath, 'utf8')), THRESHOLDS);
    return report(result, base, log);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
