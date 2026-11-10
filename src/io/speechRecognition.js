const browserProvider = () => window.webkitSpeechRecognition;

let provider = browserProvider;

export const setSpeechRecognitionProvider = (next) => {
    provider = next;
};

export const resetSpeechRecognitionProvider = () => {
    provider = browserProvider;
};

export const isSpeechRecognitionAvailable = () => Boolean(provider());

export const createSpeechRecognition = () => {
    const Recognition = provider();
    return new Recognition();
};
