import React from 'react';
import ReactDOM from 'react-dom/client';
import LoadingGate from './components/LoadingGate.jsx';
import { browserStorage } from './persistence/profileStorage';
import { loadGame } from './utils/preload';
import './index.css';

const load = (onProgress) =>
    loadGame({
        importApp: () => import('./App.jsx'),
        importData: () => import('./constants/gameData.jsx'),
        storage: browserStorage,
        onProgress,
    });

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LoadingGate load={load} />
    </React.StrictMode>,
);
