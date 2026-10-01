import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Register PWA service worker for offline cache and speed
serviceWorkerRegistration.register();