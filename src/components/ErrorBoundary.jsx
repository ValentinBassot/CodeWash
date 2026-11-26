import React from 'react';
import { MONITORING_TEXTS, fillText } from '../constants/monitoringTexts';
import { recordCrash } from '../monitoring';
import { describeError } from '../monitoring/events';
import { attempt } from '../monitoring/safe';

const reloadPage = () => window.location.reload();

class ErrorBoundary extends React.Component {
    state = { hasCrashed: false, errorType: '', message: '' };

    static getDerivedStateFromError(error) {
        return { hasCrashed: true, ...describeError(error) };
    }

    componentDidCatch(error, info) {
        attempt(() => recordCrash(error, info?.componentStack));
    }

    render() {
        const { hasCrashed, errorType, message } = this.state;
        if (!hasCrashed) return this.props.children;
        const texts = MONITORING_TEXTS.crashScreen;
        const onReload = this.props.onReload || reloadPage;
        return (
            <div
                role="alert"
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-slate-950 p-8 text-center text-slate-100"
            >
                <h1 className="text-5xl font-bold uppercase tracking-widest text-yellow-400">{texts.title}</h1>
                <p className="max-w-xl text-2xl">{texts.message}</p>
                <button
                    onClick={onReload}
                    className="rounded-lg border-2 border-yellow-400 bg-yellow-500 px-6 py-3 text-2xl font-bold uppercase text-slate-900 hover:bg-yellow-400"
                >
                    {texts.reload}
                </button>
                <p className="max-w-xl text-sm text-slate-400">{fillText(texts.detail, { errorType, message })}</p>
            </div>
        );
    }
}

export default ErrorBoundary;
