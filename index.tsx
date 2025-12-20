import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    process: {
      env: {
        API_KEY?: string;
      };
    };
  }
}

/**
 * Robust polyfill for process.env.
 * This ensures that components importing @google/genai can safely 
 * access process.env.API_KEY.
 */
if (typeof window.process === 'undefined') {
  (window as any).process = { env: {} };
} else if (!window.process.env) {
  window.process.env = {};
}

// Fallback for API_KEY if not injected via script
if (!window.process.env.API_KEY) {
  window.process.env.API_KEY = "";
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}