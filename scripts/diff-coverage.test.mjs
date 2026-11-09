import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { evaluate, main, parseDiff, parseLcov, report } from './diff-coverage.mjs';

const LCOV = [
    'SF:src/a.js',
    'DA:1,1',
    'DA:2,0',
    'DA:3,4',
    'DA:5,0',
    'end_of_record',
    'SF:src/b.js',
    'DA:10,1',
    'end_of_record',
].join('\n');

const DIFF = [
    'diff --git a/src/a.js b/src/a.js',
    '--- a/src/a.js',
    '+++ b/src/a.js',
    '@@ -2,1 +2,3 @@ export const x = 1;',
    '-old line two',
    '+new line two',
    '+added three',
    '+added four',
    '@@ -9,0 +5,1 @@',
    '+added five',
    'diff --git a/README.md b/README.md',
    '--- a/README.md',
    '+++ b/README.md',
    '@@ -1,0 +1,1 @@',
    '+text',
    'diff --git a/src/gone.js b/src/gone.js',
    '--- a/src/gone.js',
    '+++ /dev/null',
    '@@ -1,2 +0,0 @@',
    '-a',
    '-b',
].join('\n');

describe('parseLcov', () => {
    it('maps each file to the hit count of its executable lines', () => {
        const lcov = parseLcov(LCOV);
        expect([...lcov.keys()]).toEqual(['src/a.js', 'src/b.js']);
        expect(lcov.get('src/a.js')).toEqual(
            new Map([
                [1, 1],
                [2, 0],
                [3, 4],
                [5, 0],
            ]),
        );
    });
});

describe('parseDiff', () => {
    it('splits new lines into modified (replacing a removed line) and added', () => {
        const diff = parseDiff(DIFF);
        expect(diff.get('src/a.js')).toEqual({ modified: [2], added: [3, 4, 5] });
    });

    it('keeps files without new lines out, and lists other files as they are', () => {
        const diff = parseDiff(DIFF);
        expect(diff.has('src/gone.js')).toBe(false);
        expect(diff.get('README.md')).toEqual({ modified: [], added: [1] });
    });
});

describe('evaluate', () => {
    const report = (thresholds) => evaluate(parseDiff(DIFF), parseLcov(LCOV), thresholds);

    it('counts only executable lines of covered files', () => {
        const r = report({ added: 100, modified: 80 });
        expect(r.added).toEqual({ total: 2, covered: 1, pct: 50 });
        expect(r.modified).toEqual({ total: 1, covered: 0, pct: 0 });
    });

    it('lists the uncovered changed lines', () => {
        expect(report({ added: 100, modified: 80 }).uncovered).toEqual(['src/a.js:2 (modified)', 'src/a.js:5 (added)']);
    });

    it('fails when a threshold is not met', () => {
        expect(report({ added: 100, modified: 80 }).ok).toBe(false);
        expect(report({ added: 50, modified: 0 }).ok).toBe(true);
    });

    it('passes when no executable line changed', () => {
        const r = evaluate(parseDiff(DIFF), parseLcov('SF:src/other.js\nDA:1,1\nend_of_record'), {
            added: 100,
            modified: 80,
        });
        expect(r).toMatchObject({ ok: true, added: { total: 0, pct: 100 }, modified: { total: 0, pct: 100 } });
    });
});

describe('report', () => {
    it('prints the counts and every uncovered line, and returns 1 on failure', () => {
        const log = vi.fn();
        const code = report(
            evaluate(parseDiff(DIFF), parseLcov(LCOV), { added: 100, modified: 80 }),
            'origin/develop',
            log,
        );
        expect(code).toBe(1);
        expect(log.mock.calls.map(([line]) => line)).toEqual([
            'diff-coverage against origin/develop',
            '  added lines:    1/2 covered (50 %, need 100 %)',
            '  modified lines: 0/1 covered (0 %, need 80 %)',
            '  not covered: src/a.js:2 (modified)',
            '  not covered: src/a.js:5 (added)',
        ]);
    });
});

describe('main', () => {
    const lcovFile = () => {
        const path = join(mkdtempSync(join(tmpdir(), 'diff-coverage-')), 'lcov.info');
        writeFileSync(path, LCOV);
        return path;
    };

    it('asks to run the coverage first when the lcov file is missing', () => {
        const log = vi.fn();
        expect(main({ argv: ['node', 'script', 'HEAD'], env: {}, lcovPath: '/nowhere/lcov.info', log })).toBe(1);
        expect(log).toHaveBeenCalledWith(
            'diff-coverage: /nowhere/lcov.info not found, run "npm run test:coverage" first',
        );
    });

    it('compares against the base given on the command line, then DIFF_BASE', () => {
        const log = vi.fn();
        expect(main({ argv: ['node', 'script', 'HEAD'], env: {}, lcovPath: lcovFile(), log })).toBe(0);
        expect(log).toHaveBeenCalledWith('diff-coverage against HEAD');
        expect(main({ argv: ['node', 'script'], env: { DIFF_BASE: 'HEAD' }, lcovPath: lcovFile(), log })).toBe(0);
        expect(log).toHaveBeenLastCalledWith('  modified lines: 0/0 covered (100 %, need 80 %)');
    });
});
