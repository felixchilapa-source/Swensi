
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Ensure process is polyfilled for the browser if env-config.js failed or is slow
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
