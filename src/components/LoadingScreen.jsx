import React from 'react';

export const FADE_OUT_MS = 300;

const LoadingScreen = ({ percent, leaving = false, failed = false, label = 'Loading' }) => (
    <div
        className={leaving ? 'boot boot-leaving' : 'boot'}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
    >
        <h1 className="boot-title">Level Up!</h1>
        <div className="boot-bar">
            <div className="boot-fill" style={{ transform: `scaleX(${percent / 100})` }} />
        </div>
        <p className="boot-percent">{percent}%</p>
        {failed && (
            <div role="alert" className="boot-error">
                <p>The game could not be loaded.</p>
                <button type="button" onClick={() => window.location.reload()}>
                    Reload
                </button>
            </div>
        )}
    </div>
);

export default LoadingScreen;
