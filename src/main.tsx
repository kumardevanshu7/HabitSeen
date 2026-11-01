import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update and automatic refresh when new build is detected
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegistered(registration) {
    if (registration) {
      registration.update();
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
});

// Globally capture beforeinstallprompt event so it is never missed before components mount
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
