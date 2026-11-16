import { useEffect, useRef, useState } from 'react';
import { requestMicrophoneAccess } from '../io/microphone';

export const useMicrophoneAccess = () => {
    const [access, setAccess] = useState('asking');
    const request = useRef(null);

    useEffect(() => {
        let ignore = false;
        request.current ??= requestMicrophoneAccess();
        request.current.then((result) => {
            if (!ignore) setAccess(result);
        });
        return () => {
            ignore = true;
        };
    }, []);

    return access;
};
