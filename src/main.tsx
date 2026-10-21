import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Register PWA service worker with auto-update and automatic refresh
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
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
    <ErrorBoundary fallbackTitle="HabitsSeen encountered an unexpected issue">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
