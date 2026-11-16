import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MIC_OFF_TEXT, useVoiceListener } from './useVoiceListener';
import { resetSpeechRecognitionProvider, setSpeechRecognitionProvider } from '../io/speechRecognition';

class FakeRecognition {
    static instances = [];
    static failOnStart = false;
    static failOnStop = false;
    constructor() {
        FakeRecognition.instances.push(this);
    }
    start() {
        if (FakeRecognition.failOnStart) throw new Error('cannot start');
        this.onstart();
    }
    stop() {
        if (FakeRecognition.failOnStop) throw new Error('cannot stop');
        this.onend();
    }
}

const last = () => FakeRecognition.instances.at(-1);
const final = (transcript) => Object.assign([{ transcript }], { isFinal: true });
const interim = (transcript) => Object.assign([{ transcript }], { isFinal: false });
const listen = (options = {}) => {
    const onHeard = vi.fn();
    const state = { keep: options.keep ?? true };
    const hook = renderHook(() => useVoiceListener({ keepListening: () => state.keep, onHeard }));
    return { ...hook, onHeard, state };
};

beforeEach(() => {
    vi.useFakeTimers();
    FakeRecognition.instances = [];
    FakeRecognition.failOnStart = false;
    FakeRecognition.failOnStop = false;
    setSpeechRecognitionProvider(() => FakeRecognition);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    resetSpeechRecognitionProvider();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('useVoiceListener', () => {
    it('is silent before anything starts', () => {
        const { result } = listen();
        expect(result.current).toMatchObject({ isListening: false, spokenText: '' });
    });

    it('start listens in English, continuously', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        expect(last()).toMatchObject({ lang: 'en-US', continuous: true });
        expect(result.current).toMatchObject({ isListening: true, spokenText: 'Listening...' });
    });

    it('start does nothing twice, and nothing without speech recognition', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        act(() => result.current.start('reading'));
        expect(FakeRecognition.instances).toHaveLength(1);

        setSpeechRecognitionProvider(() => undefined);
        const other = listen();
        act(() => other.result.current.start('reading'));
        expect(FakeRecognition.instances).toHaveLength(1);
        expect(other.result.current.isListening).toBe(false);
    });

    it('gives what was heard, cleaned up, with the skill it listens for', () => {
        const { result, onHeard } = listen();
        act(() => result.current.start('reading'));
        act(() => last().onresult({ results: [final('ignored'), final('Cat.')] }));
        expect(onHeard).toHaveBeenCalledWith('CAT', 'reading');
        expect(result.current.spokenText).toBe('CAT');
        act(() => result.current.clearSpokenText());
        expect(result.current.spokenText).toBe('');
    });

    it('shows what is being said while it is said, and judges only the final text', () => {
        const { result, onHeard } = listen();
        act(() => result.current.start('reading'));
        expect(last().interimResults).toBe(true);

        act(() => last().onresult({ results: [interim('the')] }));
        expect(result.current).toMatchObject({ spokenText: 'THE', isFinalSpeech: false });
        expect(onHeard).not.toHaveBeenCalled();

        act(() => last().onresult({ results: [final('the cat')] }));
        expect(result.current).toMatchObject({ spokenText: 'THE CAT', isFinalSpeech: true });
        expect(onHeard).toHaveBeenCalledWith('THE CAT', 'reading');
    });

    it.each([
        ['service-not-allowed', 'Speech service not allowed'],
        ['audio-capture', 'No microphone found'],
        ['network', 'Speech service unreachable'],
    ])('a %s error is shown and stops the restarts', (error, text) => {
        vi.useFakeTimers();
        const { result } = listen();
        act(() => result.current.start('reading'));
        act(() => {
            last().onerror({ error });
            last().onend();
        });
        expect(result.current).toMatchObject({ spokenText: text, isListening: false });
        act(() => vi.advanceTimersByTime(1000));
        expect(FakeRecognition.instances).toHaveLength(1);
        vi.useRealTimers();
    });

    it('says that the speech failed after an error of the service, and not any more once it listens again', () => {
        const { result } = listen();
        expect(result.current.hasFailed).toBe(false);
        act(() => result.current.start('reading'));
        act(() => last().onerror({ error: 'network' }));
        expect(result.current.hasFailed).toBe(true);
        act(() => last().onend());
        act(() => result.current.start('reading'));
        expect(result.current.hasFailed).toBe(false);
    });

    it('a silence is not an error to show', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        act(() => last().onerror({ error: 'no-speech' }));
        expect(result.current.spokenText).toBe('Listening...');
    });

    it('stop ends the session and shows the microphone as off', () => {
        const { result, state } = listen();
        act(() => result.current.start('math'));
        state.keep = false;
        act(() => result.current.stop());
        expect(result.current).toMatchObject({ isListening: false, spokenText: MIC_OFF_TEXT });
    });

    it('stop still turns the microphone off when the browser refuses to stop', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        FakeRecognition.failOnStop = true;
        act(() => result.current.stop());
        expect(result.current).toMatchObject({ isListening: false, spokenText: MIC_OFF_TEXT });
        expect(console.warn).toHaveBeenCalledWith('[Speech Recognition] Error stopping:', expect.any(Error));
    });

    it('a start refused by the browser is reported and leaves the microphone off', () => {
        FakeRecognition.failOnStart = true;
        const { result } = listen();
        act(() => result.current.start('reading'));
        expect(result.current.isListening).toBe(false);
        expect(console.error).toHaveBeenCalledWith('[Speech Recognition] Failed to start:', expect.any(Error));
    });

    it('a session that ends is started again while listening must go on', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        act(() => last().onend());
        act(() => vi.advanceTimersByTime(100));
        expect(FakeRecognition.instances).toHaveLength(2);
        expect(result.current.isListening).toBe(true);
    });

    it('a session that ends is not started again once listening must stop', () => {
        const { result, state } = listen();
        act(() => result.current.start('reading'));
        state.keep = false;
        act(() => last().onend());
        act(() => vi.advanceTimersByTime(100));
        expect(FakeRecognition.instances).toHaveLength(1);
        expect(result.current.isListening).toBe(false);
    });

    it('outside a reading battle, a session that ends shows the microphone as off', () => {
        const { result } = listen({ keep: false });
        act(() => result.current.start('math'));
        act(() => last().onend());
        expect(result.current.spokenText).toBe(MIC_OFF_TEXT);
    });

    it('a refused microphone is announced and not started again; other errors are ignored', () => {
        const { result } = listen();
        act(() => result.current.start('reading'));
        act(() => last().onerror({ error: 'no-speech' }));
        expect(result.current.isListening).toBe(true);
        act(() => {
            last().onerror({ error: 'not-allowed' });
            last().onend();
        });
        act(() => vi.advanceTimersByTime(1000));
        expect(FakeRecognition.instances).toHaveLength(1);
        expect(result.current).toMatchObject({ isListening: false, spokenText: 'Mic permission denied' });
    });

    it('toggle starts, then stops, and says when there is no microphone support', () => {
        const { result, state } = listen();
        act(() => result.current.toggle('reading'));
        expect(result.current.isListening).toBe(true);
        state.keep = false;
        act(() => result.current.toggle('reading'));
        expect(result.current.isListening).toBe(false);

        setSpeechRecognitionProvider(() => undefined);
        act(() => result.current.toggle('reading'));
        expect(result.current.spokenText).toBe('Mic not available');
    });
});
