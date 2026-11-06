import { describe, it, expect } from 'vitest';
import { electronEnv } from './run-electron.mjs';

describe('electronEnv', () => {
    it('removes ELECTRON_RUN_AS_NODE so Electron starts as an app', () => {
        expect(electronEnv({ ELECTRON_RUN_AS_NODE: '1', PATH: '/bin' })).toEqual({ PATH: '/bin' });
    });

    it('does not mutate the caller environment', () => {
        const env = { ELECTRON_RUN_AS_NODE: '1' };
        electronEnv(env);
        expect(env).toEqual({ ELECTRON_RUN_AS_NODE: '1' });
    });
});
