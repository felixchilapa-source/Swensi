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

// Ensure process is polyfilled for the browser if env-config.js failed or is slow
if (typeof window.process === 'undefined') {
  window.process = { env: {} };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}