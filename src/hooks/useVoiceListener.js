import { useEffect, useRef, useState } from 'react';
import { normalizeSpeech } from '../domain/reading';
import { createSpeechRecognition, isSpeechRecognitionAvailable } from '../io/speechRecognition';

export const MIC_OFF_TEXT = 'Mic Off';
const RESTART_DELAY_MS = 100;

const ERROR_TEXTS = {
    'not-allowed': 'Mic permission denied',
    'service-not-allowed': 'Speech service not allowed',
    'audio-capture': 'No microphone found',
    network: 'Speech service unreachable',
};

export const useVoiceListener = ({ keepListening, onHeard }) => {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const [isFinalSpeech, setIsFinalSpeech] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);
    const recognitionRef = useRef(null);
    const micRefusedRef = useRef(false);
    const callbacksRef = useRef({ keepListening, onHeard });

    useEffect(() => {
        callbacksRef.current = { keepListening, onHeard };
    });

    const stop = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.warn('[Speech Recognition] Error stopping:', error);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setSpokenText(MIC_OFF_TEXT);
    };

    const start = (targetId) => {
        if (!isSpeechRecognitionAvailable()) {
            console.warn('[Speech Recognition] Web Speech API not available');
            return;
        }
        if (recognitionRef.current) return;

        micRefusedRef.current = false;
        const recognition = createSpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setHasFailed(false);
            setIsListening(true);
            setSpokenText('Listening...');
        };

        recognition.onend = () => {
            setIsListening(false);
            if (micRefusedRef.current) {
                if (recognitionRef.current === recognition) recognitionRef.current = null;
                return;
            }
            if (!callbacksRef.current.keepListening() && targetId !== 'reading') {
                setSpokenText(MIC_OFF_TEXT);
                return;
            }
            setTimeout(() => {
                if (recognitionRef.current !== recognition) return;
                recognitionRef.current = null;
                if (callbacksRef.current.keepListening()) start(targetId);
            }, RESTART_DELAY_MS);
        };

        recognition.onerror = (event) => {
            console.error('[Speech Recognition] Error:', event.error);
            if (!ERROR_TEXTS[event.error]) return;
            micRefusedRef.current = true;
            setHasFailed(true);
            setSpokenText(ERROR_TEXTS[event.error]);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const heard = event.results[event.results.length - 1];
            const text = normalizeSpeech(heard[0].transcript);
            setSpokenText(text);
            setIsFinalSpeech(heard.isFinal);
            if (heard.isFinal) callbacksRef.current.onHeard(text, targetId);
        };

        try {
            recognition.start();
        } catch (error) {
            console.error('[Speech Recognition] Failed to start:', error);
        }
    };

    const toggle = (targetId) => {
        if (!isSpeechRecognitionAvailable()) {
            console.warn('[Mic Toggle] Web Speech API not available');
            setSpokenText('Mic not available');
            return;
        }
        if (recognitionRef.current && isListening) {
            stop();
        } else {
            start(targetId);
        }
    };

    return {
        isListening,
        spokenText,
        isFinalSpeech,
        hasFailed,
        clearSpokenText: (onlyIf) =>
            setSpokenText((current) => (onlyIf === undefined || current === onlyIf ? '' : current)),
        markHandled: () => setIsFinalSpeech(false),
        start,
        stop,
        toggle,
    };
};
