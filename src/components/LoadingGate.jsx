import React, { useEffect, useState } from 'react';
import LoadingScreen, { FADE_OUT_MS } from './LoadingScreen';

const LoadingGate = ({ load, label }) => {
    const [percent, setPercent] = useState(0);
    const [loaded, setLoaded] = useState(null);
    const [failed, setFailed] = useState(false);
    const [screenShown, setScreenShown] = useState(true);

    useEffect(() => {
        let active = true;
        load((value) => active && setPercent(value)).then(
            (App) => active && setLoaded({ App }),
            () => active && setFailed(true),
        );
        return () => {
            active = false;
        };
    }, [load]);

    useEffect(() => {
        if (!loaded) return undefined;
        const timer = setTimeout(() => setScreenShown(false), FADE_OUT_MS);
        return () => clearTimeout(timer);
    }, [loaded]);

    const Game = loaded?.App;

    return (
        <>
            {Game && <Game />}
            {screenShown && (
                <LoadingScreen
                    percent={loaded ? 100 : percent}
                    leaving={Boolean(loaded)}
                    failed={failed}
                    label={label}
                />
            )}
        </>
    );
};

export default LoadingGate;
