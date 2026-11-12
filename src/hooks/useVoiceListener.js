import { useEffect, useRef, useState } from 'react';
import { normalizeSpeech } from '../domain/reading';
import { createSpeechRecognition, isSpeechRecognitionAvailable } from '../io/speechRecognition';

export const MIC_OFF_TEXT = 'Mic Off';
const RESTART_DELAY_MS = 100;

export const useVoiceListener = ({ keepListening, onHeard }) => {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
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

        recognition.onstart = () => {
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
            if (event.error !== 'not-allowed') return;
            micRefusedRef.current = true;
            setSpokenText('Mic permission denied');
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const text = normalizeSpeech(event.results[event.results.length - 1][0].transcript);
            setSpokenText(text);
            callbacksRef.current.onHeard(text, targetId);
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

    return { isListening, spokenText, clearSpokenText: () => setSpokenText(''), start, stop, toggle };
};
