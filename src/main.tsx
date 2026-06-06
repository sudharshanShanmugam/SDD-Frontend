import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove initial loading screen
if (typeof window.__APP_LOADED__ === 'function') {
  window.__APP_LOADED__();
}

// Type declaration for global
declare global {
  interface Window {
    __APP_LOADED__?: () => void;
  }
}
