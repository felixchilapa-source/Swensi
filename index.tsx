import React, { Component, ReactNode } from 'react';
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

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Simple Error Boundary
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#fff', textAlign: 'center', background: '#0F172A', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '10px'}}>Swensi Nakonde</h1>
          <h2 style={{fontSize: '16px', color: '#DC2626'}}>System Malfunction</h2>
          <p style={{fontSize: '12px', color: '#94A3B8', marginTop: '10px'}}>We encountered a critical error while loading the terminal.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', cursor: 'pointer' }}
          >
            Reset Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}