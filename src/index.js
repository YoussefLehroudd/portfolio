import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext';

// Suppress benign ResizeObserver loop errors that can trigger React's error overlay.
// We keep this in index.js so it runs once and avoid duplicating in components.
const suppressResizeObserverError = (event) => {
  const msg = event?.message || event?.reason?.message || '';
  if (msg.includes('ResizeObserver loop') || msg.includes('ResizeObserver loop completed')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
};
const isResizeObserverError = (err) => {
  const msg = err?.message || err?.reason?.message || err?.toString?.() || '';
  return msg.includes('ResizeObserver loop');
};

// Override ResizeObserver to prevent loops
const OriginalResizeObserver = window.ResizeObserver;
if (OriginalResizeObserver) {
  window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      const wrappedCallback = (entries, observer) => {
        try {
          callback(entries, observer);
        } catch (error) {
          if (error.message && isResizeObserverError(error)) {
            return;
          }
          throw error;
        }
      };
      super(wrappedCallback);
    }
  };
}

// Capture phase to stop the error before React's overlay sees it
window.addEventListener('error', suppressResizeObserverError, { capture: true, passive: true });
window.addEventListener('unhandledrejection', suppressResizeObserverError, { capture: true, passive: true });

// Extra guard in case overlay attaches later
setTimeout(() => {
  window.addEventListener('error', suppressResizeObserverError, { capture: true, passive: true });
  window.addEventListener('unhandledrejection', suppressResizeObserverError, { capture: true, passive: true });
}, 0);

// Final fallback: short-circuit global handlers for the specific benign ResizeObserver error
const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const msg = (message?.toString() || '') + (error?.message || '');
  if (msg.includes('ResizeObserver loop')) {
    return true; // swallow
  }
  if (typeof originalOnError === 'function') {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

const originalOnUnhandledRejection = window.onunhandledrejection;
window.onunhandledrejection = (event) => {
  const msg = event?.reason?.message || '';
  if (msg.includes('ResizeObserver loop')) {
    event.preventDefault();
    return true;
  }
  if (typeof originalOnUnhandledRejection === 'function') {
    return originalOnUnhandledRejection(event);
  }
  return false;
};

// Patch CRA overlay (react-error-overlay) to ignore this benign error
const patchOverlay = () => {
  const overlay = window.__REACT_ERROR_OVERLAY_GLOBAL_HANDLER__;
  if (!overlay) return false;

  if (overlay.onError) {
    const origOnError = overlay.onError.bind(overlay);
    overlay.onError = (err) => {
      if (isResizeObserverError(err)) return;
      return origOnError(err);
    };
  }
  if (overlay.onUnhandledRejection) {
    const origOnUnhandledRejection = overlay.onUnhandledRejection.bind(overlay);
    overlay.onUnhandledRejection = (err) => {
      if (isResizeObserverError(err)) return;
      return origOnUnhandledRejection(err);
    };
  }
  return true;
};

if (!patchOverlay()) {
  const overlayInterval = setInterval(() => {
    if (patchOverlay()) clearInterval(overlayInterval);
  }, 100);
  setTimeout(() => clearInterval(overlayInterval), 3000);
}

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
