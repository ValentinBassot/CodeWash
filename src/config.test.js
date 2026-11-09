import { describe, expect, it } from 'vitest';
import { parseConfig } from './config';

describe('parseConfig', () => {
    it('is empty when nothing is configured', () => {
        expect(parseConfig({})).toEqual({ bugReportEmail: null, triviaApiUrl: null });
    });

    it('reads the bug report contact and the trivia API', () => {
        expect(
            parseConfig({
                VITE_BUG_REPORT_EMAIL: 'support@example.com',
                VITE_TRIVIA_API_URL: 'https://example.com/api.php',
            }),
        ).toEqual({ bugReportEmail: 'support@example.com', triviaApiUrl: 'https://example.com/api.php' });
    });

    it('trims spaces left in the .env file', () => {
        expect(parseConfig({ VITE_BUG_REPORT_EMAIL: '  support@example.com  ' }).bugReportEmail).toBe(
            'support@example.com',
        );
    });

    it('rejects a contact that is not an e-mail address', () => {
        expect(() => parseConfig({ VITE_BUG_REPORT_EMAIL: 'not-an-email' })).toThrow(/VITE_BUG_REPORT_EMAIL/);
    });

    it('rejects an API address that is not http or https', () => {
        expect(() => parseConfig({ VITE_TRIVIA_API_URL: 'ftp://example.com' })).toThrow(/VITE_TRIVIA_API_URL/);
        expect(() => parseConfig({ VITE_TRIVIA_API_URL: 'nope' })).toThrow(/VITE_TRIVIA_API_URL/);
    });

    it('treats an empty value as not configured', () => {
        expect(parseConfig({ VITE_BUG_REPORT_EMAIL: '', VITE_TRIVIA_API_URL: '   ' })).toEqual({
            bugReportEmail: null,
            triviaApiUrl: null,
        });
    });
});
