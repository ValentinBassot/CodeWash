import { describe, expect, it } from 'vitest';
import { MONITORING_TEXTS, fillText } from './monitoringTexts';

describe('fillText', () => {
    it('fills each placeholder with its value, numbers included', () => {
        expect(fillText('{count} crashes of {errorType}', { count: 0, errorType: 'TypeError' })).toBe(
            '0 crashes of TypeError',
        );
    });

    it('keeps a placeholder that has no value', () => {
        expect(fillText('{a} and {b}', { a: 1 })).toBe('1 and {b}');
        expect(fillText('{a}')).toBe('{a}');
    });
});

describe('MONITORING_TEXTS', () => {
    it('does not promise more than the code does about the privacy', () => {
        expect(MONITORING_TEXTS.health.privacy).toContain('nothing is sent anywhere');
        expect(MONITORING_TEXTS.health.privacy).toContain('look at an exported file');
    });
});
