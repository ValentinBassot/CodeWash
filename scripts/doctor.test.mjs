import { describe, it, expect } from 'vitest';
import { diagnose, parseNpmVersion } from './doctor.mjs';

const healthy = { nodeVersion: 'v22.11.0', npmVersion: '10.9.0', env: {} };
const ids = (problems) => problems.map((p) => p.id);

describe('diagnose', () => {
  it('reports nothing on a supported environment', () => {
    expect(diagnose(healthy)).toEqual([]);
  });

  it('flags Node older than 20', () => {
    expect(ids(diagnose({ ...healthy, nodeVersion: 'v18.19.0' }))).toEqual(['node-too-old']);
  });

  it('flags npm older than 10 (cannot read the rolldown-vite alias in the lockfile)', () => {
    expect(ids(diagnose({ ...healthy, npmVersion: '9.2.0' }))).toEqual(['npm-too-old']);
  });

  it('flags ELECTRON_RUN_AS_NODE, which turns Electron into plain Node', () => {
    expect(ids(diagnose({ ...healthy, env: { ELECTRON_RUN_AS_NODE: '1' } }))).toEqual([
      'electron-run-as-node',
    ]);
  });

  it('does not flag npm when its version is unknown', () => {
    expect(diagnose({ ...healthy, npmVersion: undefined })).toEqual([]);
  });

  it('gives every problem a fix the reader can apply', () => {
    const all = diagnose({
      nodeVersion: 'v18.0.0',
      npmVersion: '9.2.0',
      env: { ELECTRON_RUN_AS_NODE: '1' },
    });
    expect(all).toHaveLength(3);
    for (const p of all) expect(p.fix).toMatch(/\S/);
  });
});

describe('parseNpmVersion', () => {
  it('reads the npm version from npm_config_user_agent', () => {
    expect(parseNpmVersion('npm/10.9.2 node/v22.22.1 linux x64 workspaces/false')).toBe('10.9.2');
  });

  it('returns undefined when not launched through npm', () => {
    expect(parseNpmVersion(undefined)).toBeUndefined();
    expect(parseNpmVersion('yarn/1.22.0 npm/? node/v22.0.0')).toBeUndefined();
  });
});
