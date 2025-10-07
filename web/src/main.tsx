import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/react-select.css';

// Initialize Sentry for error monitoring
import { initSentry } from "@dislink/shared/lib/sentry";
initSentry();

// Initialize logging for production debugging
const isProduction = import.meta.env.PROD;

if (!isProduction) {
  console.log('🚀 Starting React app...');
  console.log('📁 Current location:', window.location.href);
  console.log('🔍 Document ready state:', document.readyState);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </Router>
  </StrictMode>
);

// Initialize Supabase connection
import('@dislink/shared/lib/supabase').then(({ initializeConnection }) => {
  initializeConnection().catch(error => {
    console.error('❌ Supabase initialization failed:', error);
  });
}).catch(error => {
  console.error('❌ Failed to load Supabase module:', error);
});

// Initialize Cosmic Theme System
import('./lib/cosmicThemes').then(({ cosmicThemeManager }) => {
  cosmicThemeManager.getCurrentTheme();
  const currentPalette = cosmicThemeManager.getCurrentPalette();
  console.log(`✨ Cosmic theme loaded: ${currentPalette.name} - ${currentPalette.description}`);
}).catch(error => {
  console.error('❌ Failed to load Cosmic Theme System:', error);
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('❌ Uncaught error:', event.error);
});
