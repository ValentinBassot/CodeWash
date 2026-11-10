import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createSpeechRecognition,
    isSpeechRecognitionAvailable,
    resetSpeechRecognitionProvider,
    setSpeechRecognitionProvider,
} from './speechRecognition';

class FakeRecognition {}

afterEach(() => {
    resetSpeechRecognitionProvider();
    vi.unstubAllGlobals();
});

describe('speech recognition', () => {
    it('is not available when the browser has no webkitSpeechRecognition', () => {
        expect(isSpeechRecognitionAvailable()).toBe(false);
    });

    it('uses the browser webkitSpeechRecognition, read at call time', () => {
        vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
        expect(isSpeechRecognitionAvailable()).toBe(true);
        expect(createSpeechRecognition()).toBeInstanceOf(FakeRecognition);
    });

    it('can be replaced by another provider until it is reset', () => {
        class Other {}
        setSpeechRecognitionProvider(() => Other);
        expect(isSpeechRecognitionAvailable()).toBe(true);
        expect(createSpeechRecognition()).toBeInstanceOf(Other);
        resetSpeechRecognitionProvider();
        expect(isSpeechRecognitionAvailable()).toBe(false);
    });
});
