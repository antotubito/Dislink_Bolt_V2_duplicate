import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { initializeConnection } from './lib/supabase';
import { logger } from './lib/logger';

// Initialize Supabase connection in the background
setTimeout(() => {
  initializeConnection().catch(error => {
    logger.error('Background Supabase initialization failed:', error);
  });
}, 0);

function handleCriticalError(error: Error, context: string) {
  logger.error(`Critical error in ${context}:`, error);
  
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  errorContainer.innerHTML = `
    <div style="text-align: center; max-width: 400px; padding: 20px;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
      <p style="color: #6b7280; margin-bottom: 20px;">
        We're having trouble loading the application. Please refresh the page.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Refresh Page
      </button>
    </div>
  `;
  
  document.body.innerHTML = '';
  document.body.appendChild(errorContainer);
}

try {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container not found');
  }

  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  handleCriticalError(error as Error, 'main rendering');
}